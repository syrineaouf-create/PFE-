import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { Formateur } from '../formateurs/formateur.entity';
import { Apprenant } from '../apprenants/apprenant.entity';
import { CreateSessionDto, UpdateSessionDto } from './session.dto';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
    @InjectRepository(Formateur)
    private readonly formateurRepo: Repository<Formateur>,
    @InjectRepository(Apprenant)
    private readonly apprenantRepo: Repository<Apprenant>,
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const today = new Date().toISOString().split('T')[0];
    if (dto.date_debut < today) {
      throw new BadRequestException('La date de début ne peut pas être dans le passé.');
    }
    if (dto.date_fin < dto.date_debut) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }

    if (dto.formateur) {
      const fmt = dto.formateur;
      const allFormateurs = await this.formateurRepo.find();
      const mapped = allFormateurs.find(f =>
        `${f.prenom} ${f.nom}`.trim() === fmt.trim() ||
        `${f.nom} ${f.prenom}`.trim() === fmt.trim()
      );
      if (mapped) {
        if (mapped.statut !== 'Actif') {
          throw new BadRequestException(`Impossible d'assigner la session : le formateur ${fmt} n'est pas actif.`);
        }
        if (dto.formation && (!mapped.specialite || !mapped.specialite.includes(dto.formation))) {
          throw new BadRequestException(`Le formateur ${fmt} n'a pas la spécialité requise ("${dto.formation}").`);
        }
      }

      const overlapping = await this.repo.findOne({
        where: {
          formateur: fmt,
          date_debut: LessThanOrEqual(dto.date_fin),
          date_fin: MoreThanOrEqual(dto.date_debut),
        }
      });
      if (overlapping) {
        throw new BadRequestException(`Ce formateur est déjà assigné à une autre session sur cette période (du ${overlapping.date_debut} au ${overlapping.date_fin}).`);
      }
    }

    const session = this.repo.create(dto);
    try {
      const saved = await this.repo.save(session);
      // Déclencheur intelligent asynchrone (ne bloque pas la requête)
      this.triggerIntelligentEmailAlert(saved).catch(err => console.error("Email Bot Error", err));
      return saved;
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Erreur lors de la sauvegarde de la session');
    }
  }

  private async triggerIntelligentEmailAlert(session: Session) {
    console.log(`[Smart Alert] Scan pour ${session.formation}...`);
    const allApprenants = await this.apprenantRepo.find();
    const targets = allApprenants.filter(a => {
       if (!a.reservations_futures || !Array.isArray(a.reservations_futures)) return false;
       return a.reservations_futures.some(r => r.formation === session.formation && !r.session_id);
    });

    if (targets.length === 0) {
        console.log(`[Smart Alert] Aucun candidat en attente pour ${session.formation}.`);
        return;
    }
    console.log(`[Smart Alert] ${targets.length} candidat(s) trouvé(s). Envoi d'email via Ethereal SMTP...`);
    
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({ host: account.smtp.host, port: account.smtp.port, secure: account.smtp.secure, auth: { user: account.user, pass: account.pass }});

    for (const user of targets) {
       const info = await transporter.sendMail({
           from: '"Waialys AI Automator" <no-reply@waialys.com>',
           to: user.email,
           subject: `🎯 Nouvelle Session Disponible : ${session.formation} !`,
           html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f1c3f;">
               <h2>Bonjour ${user.prenom || user.nom},</h2>
               <p>Vous avez activé une alerte pour la formation <strong>${session.formation}</strong>.</p>
               <p>🔥 Nous avons le plaisir de vous informer qu'une nouvelle session vient d'être ouverte !</p>
               <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Date :</strong> Du ${new Date(session.date_debut).toLocaleDateString('fr-FR')} au ${new Date(session.date_fin).toLocaleDateString('fr-FR')}<br/>
                  <strong>Mode :</strong> ${session.mode_formation || 'Campus'}
               </div>
               <p>Connectez-vous rapidement à votre espace apprenant pour confirmer votre inscription avant que la session ne soit complète.</p>
               <br/><hr/><p><em>Ceci est un e-mail automatique du robot Waialys.</em></p>
            </div>
           `
       });
       console.log(`[Smart Alert] 🔔 Email Envoyé à ${user.email} ! Lisez-le ici: ${nodemailer.getTestMessageUrl(info)}`);
    }
  }

  async findAll(): Promise<{ data: Session[]; total: number }> {
    const data = await this.repo.find({ order: { date_debut: 'ASC' } });
    const todayNum = new Date().setHours(0,0,0,0);

    // Recalculer le vrai nombre d'inscrits + Auto-clôture des sessions périmées
    for (const session of data) {
      let needsSave = false;
      const realCount = await this.apprenantRepo.count({ where: { session_id: session.id } });
      if (session.inscrits !== realCount) {
        session.inscrits = realCount;
        needsSave = true;
      }

      if (session.date_debut && session.date_fin) {
          try {
            const startStr = new Date(session.date_debut).toISOString().split('T')[0];
            const endStr = new Date(session.date_fin).toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];

            // Auto-clôture
            if (endStr < todayStr && (session.statut === 'Planifiée' || session.statut === 'En cours')) {
              session.statut = 'Terminée';
              needsSave = true;
            }

            // Auto-démarrage
            if (startStr <= todayStr && endStr >= todayStr && session.statut === 'Planifiée') {
              session.statut = 'En cours';
              needsSave = true;
            }
          } catch(e) {
            console.error("Erreur de parsing date sur la session ID", session.id, e);
          }
      }

      if (needsSave) {
        await this.repo.save(session);
      }
    }

    return { data, total: data.length };
  }

  async findOne(id: number): Promise<Session> {
    const session = await this.repo.findOne({ where: { id } });
    if (!session) throw new NotFoundException(`Session #${id} introuvable`);
    return session;
  }

  async update(id: number, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.findOne(id);
    const updated = this.repo.merge(session, dto);

    if (updated.date_fin < updated.date_debut) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }

    if (updated.formateur) {
      const fmt = updated.formateur;
      const allFormateurs = await this.formateurRepo.find();
      const mapped = allFormateurs.find(f =>
        `${f.prenom} ${f.nom}`.trim() === fmt.trim() ||
        `${f.nom} ${f.prenom}`.trim() === fmt.trim()
      );
      if (mapped) {
        if (mapped.statut !== 'Actif') {
          throw new BadRequestException(`Impossible d'assigner la session : le formateur ${fmt} n'est pas actif.`);
        }
        const checkFormation = updated.formation || session.formation;
        if (checkFormation && (!mapped.specialite || !mapped.specialite.includes(checkFormation))) {
          throw new BadRequestException(`Le formateur ${fmt} n'a pas la spécialité requise ("${checkFormation}").`);
        }
      }

      const overlapping = await this.repo.findOne({
        where: {
          id: Not(id),
          formateur: fmt,
          date_debut: LessThanOrEqual(updated.date_fin),
          date_fin: MoreThanOrEqual(updated.date_debut),
        }
      });
      if (overlapping) {
        throw new BadRequestException(`Ce formateur est déjà assigné à une autre session sur cette période (du ${overlapping.date_debut} au ${overlapping.date_fin}).`);
      }
    }

    return await this.repo.save(updated);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const session = await this.findOne(id);
    await this.repo.remove(session);
    return { success: true };
  }

  async getStats(): Promise<{
    total: number;
    planifiees: number;
    en_cours: number;
    terminees: number;
    total_inscrits: number;
  }> {
    const all = await this.repo.find();
    return {
      total:          all.length,
      planifiees:     all.filter(s => s.statut === 'Planifiée').length,
      en_cours:       all.filter(s => s.statut === 'En cours').length,
      terminees:      all.filter(s => s.statut === 'Terminée').length,
      total_inscrits: all.reduce((acc, s) => acc + (s.inscrits || 0), 0),
    };
  }
}
