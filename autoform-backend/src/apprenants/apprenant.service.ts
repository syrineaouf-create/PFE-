import {
  Injectable, NotFoundException, BadRequestException,
  HttpException, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Apprenant } from './apprenant.entity';
import { CreateApprenantDto, UpdateApprenantDto } from './apprenant.dto';
import { Session } from '../sessions/session.entity';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ApprenantsService {
  constructor(
    @InjectRepository(Apprenant)
    private readonly repo: Repository<Apprenant>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  // Génère un mot de passe temporaire aléatoire
  private generateTempPassword(length = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // ── CREATE ──────────────────────────────────────────────────
  async create(dto: CreateApprenantDto): Promise<Apprenant> {
    try {
      const { session_id, ...apprenantData } = dto as any;
      const tempPassword = (dto as any).mot_de_passe?.trim() || this.generateTempPassword();

      // Vérifier si l'email existe et l'utiliser en mode "Alumni Re-enrollment"
      const existing = await this.repo.findOne({ where: { email: apprenantData.email } });
      if (existing) {
        if (existing.statut === 'Certifié' || existing.compte_actif === false) {
          // Archiver l'ancienne formation
          if (existing.formation) {
            const archive = {
              formation: existing.formation,
              score_tp: existing.score_tp,
              score_theorique: existing.score_theorique,
              certificat_fichier: existing.certificat_fichier,
              date_fin: new Date().toISOString()
            };
            existing.historique_formations = [...(existing.historique_formations || []), archive];
          }

          // Remise à zéro pour la nouvelle formation
          existing.formation = apprenantData.formation;
          existing.session_id = session_id || null;
          existing.statut = 'En attente';
          existing.paiement = 'En attente';
          existing.score_tp = null as any;
          existing.score_theorique = null as any;
          existing.taux_presence = null as any;
          existing.reussite = 0;
          existing.certificat_fichier = null as any;
          existing.compte_actif = false; // Rétrogradé en attente de validation Admin

          existing.telephone = apprenantData.telephone || existing.telephone;
          existing.nom = apprenantData.nom || existing.nom;
          existing.prenom = apprenantData.prenom || existing.prenom;

          if ((dto as any).mot_de_passe) {
            existing.mot_de_passe = await bcrypt.hash((dto as any).mot_de_passe, 10);
          }

          const saved = await this.repo.save(existing);
          if (session_id) {
            const session = await this.sessionRepo.findOne({ where: { id: session_id } });
            if (session) {
              session.inscrits = (session.inscrits || 0) + 1;
              await this.sessionRepo.save(session);
            }
          }
          return saved;
        } else {
          // Mode Waitlist / Réservation : Ajout au panier des pré-inscriptions
          if (existing.formation === apprenantData.formation) {
            throw new BadRequestException('Vous êtes déjà inscrit et actif dans cette formation.');
          }
          const dejaReserve = existing.reservations_futures?.find(r => r.formation === apprenantData.formation);
          if (dejaReserve) {
            throw new BadRequestException('Vous avez déjà réservé une place pour cette formation.');
          }

          const nouvelleReservation = {
             formation: apprenantData.formation,
             mode_formation: apprenantData.mode_formation,
             session_id: apprenantData.session_id || null,
             profil_candidat: apprenantData.profil_candidat,
             date_demande: new Date().toISOString()
          };

          existing.reservations_futures = [...(existing.reservations_futures || []), nouvelleReservation];
          const saved = await this.repo.save(existing);
          return saved;
        }
      }

      // Si l'utilisateur n'existe pas, création classique
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const apprenant = this.repo.create({
        ...apprenantData,
        mot_de_passe: hashedPassword,
        compte_actif: false,
        date_activation: null,
      });
      const saved = (await this.repo.save(apprenant)) as unknown as Apprenant;

      // Incrémente le compteur d'inscrits dès qu'un apprenant est assigné à une session
      if (session_id) {
        const session = await this.sessionRepo.findOne({ where: { id: session_id } });
        if (session) {
          session.inscrits = (session.inscrits || 0) + 1;
          await this.sessionRepo.save(session);
        }
      }

      // Envoi email de bienvenue avec identifiants
      if (saved.email) {
        this.emailService.sendWelcomeEmail({
          prenom: saved.prenom || '',
          nom: saved.nom || '',
          email: saved.email,
          formation: saved.formation || '',
        }).catch(() => {/* erreur email non bloquante */});
      }

      return saved;
    } catch (e: any) {
      if (e.code === '23505') {
        throw new BadRequestException('Email déjà utilisé. Essayez de vous connecter.');
      }
      throw new BadRequestException(e.message || 'Erreur lors de la création');
    }
  }

  // ── READ ALL (avec pagination + recherche) ───────────────────
  async findAll(page = 1, limit = 1000, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? [
          { nom: Like(`%${search}%`) },
          { prenom: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { formation: Like(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'DESC' },  // plus récents en premier
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // ── PENDING (comptes en attente d'activation) ────────────────
  async findPending(): Promise<{ data: Apprenant[]; total: number }> {
    const data = await this.repo.find({
      where: { compte_actif: false },
      order: { id: 'DESC' },
    });
    // Filtrer : uniquement ceux qui ont un email (inscrits via formulaire)
    const filtered = data.filter(a => a.email && a.email.trim() !== '');
    return { data: filtered, total: filtered.length };
  }


  // ── READ ONE ─────────────────────────────────────────────────
  async findOne(id: number): Promise<Apprenant> {
    const apprenant = await this.repo.findOne({ where: { id } });
    if (!apprenant) throw new NotFoundException(`Apprenant #${id} introuvable`);
    return apprenant;
  }

  // ── UPDATE ───────────────────────────────────────────────────
  async update(id: number, dto: UpdateApprenantDto): Promise<Apprenant> {
    const apprenant = await this.findOne(id);
    
    // Hash password if modified
    if ((dto as any).mot_de_passe) {
      if ((dto as any).mot_de_passe.trim() !== '') {
        (dto as any).mot_de_passe = await bcrypt.hash((dto as any).mot_de_passe, 10);
      } else {
        delete (dto as any).mot_de_passe; // Prevent empty password updates
      }
    }

    Object.assign(apprenant, dto);
    return this.repo.save(apprenant);
  }

  // ── DELETE ───────────────────────────────────────────────────
  async remove(id: number): Promise<{ message: string }> {
    const apprenant = await this.findOne(id);
    await this.repo.remove(apprenant);
    return { message: `Apprenant #${id} supprimé avec succès` };
  }

  // ── ACTIVATE (Admin action) ───────────────────────────────────
  async activate(id: number): Promise<Apprenant> {
    const apprenant = await this.findOne(id);
    apprenant.compte_actif = true;
    apprenant.date_activation = new Date();
    const saved = await this.repo.save(apprenant);
    return saved;
  }

  // ── DEACTIVATE (Admin action) ─────────────────────────────────
  async deactivate(id: number): Promise<Apprenant> {
    const apprenant = await this.findOne(id);
    apprenant.compte_actif = false;
    const saved = await this.repo.save(apprenant);
    return saved;
  }

  // ── CRON : Désactivation auto après 2 mois ────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoDeactivateExpiredAccounts() {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60); // 2 mois = 60 jours

    const expired = await this.repo.find({
      where: {
        compte_actif: true,
        date_activation: LessThan(twoMonthsAgo),
      },
    });

    if (expired.length > 0) {
      for (const apprenant of expired) {
        apprenant.compte_actif = false;
        await this.repo.save(apprenant);
      }
      console.log(`🕛 [CRON] ${expired.length} compte(s) désactivé(s) automatiquement (expiration 2 mois)`);
    }
  }

  // ── STATS pour dashboard ─────────────────────────────────────
  async getStats() {
    const total     = await this.repo.count();
    const certifies = await this.repo.count({ where: { reussite: 1 } });
    const enCours   = await this.repo.count({ where: { reussite: 0 } });
    const enAttente = await this.repo.count({ where: { compte_actif: false } });

    const tauxReussite = total > 0 ? Math.round((certifies / total) * 100) : 0;

    const topFormations = await this.repo
      .createQueryBuilder('a')
      .select('a.formation', 'formation')
      .addSelect('COUNT(*)', 'count')
      .where('a.formation IS NOT NULL')
      .groupBy('a.formation')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const parMois = await this.repo
      .createQueryBuilder('a')
      .select("EXTRACT(MONTH FROM CAST(a.date_inscription AS DATE))", 'mois')
      .addSelect('COUNT(*)', 'count')
      .where('a.date_inscription IS NOT NULL')
      .groupBy('mois')
      .orderBy('mois', 'ASC')
      .getRawMany();

    const parFormation = await this.repo
      .createQueryBuilder('a')
      .select('a.formation', 'formation')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN a.reussite = 1 THEN 1 ELSE 0 END)', 'reussis')
      .where('a.formation IS NOT NULL')
      .groupBy('a.formation')
      .getRawMany();

    return {
      total,
      certifies,
      enCours,
      enAttente,
      tauxReussite,
      topFormations,
      parMois,
      parFormation,
    };
  }

  // ── LOGIN apprenant ───────────────────────────────────────────
  async login(email: string, mot_de_passe: string) {
    if (!email || !mot_de_passe) {
      throw new HttpException('Email et mot de passe requis', HttpStatus.BAD_REQUEST);
    }

    const apprenant = await this.repo.findOne({ where: { email } });
    if (!apprenant || !(await bcrypt.compare(mot_de_passe, apprenant.mot_de_passe))) {
      throw new HttpException('Email ou mot de passe incorrect', HttpStatus.UNAUTHORIZED);
    }

    // Vérification compte actif
    if (!apprenant.compte_actif) {
      throw new HttpException(
        'Votre compte est en attente de validation par l\'administration. Vous serez notifié(e) par email.',
        HttpStatus.FORBIDDEN,
      );
    }

    const token = this.jwtService.sign({ id: apprenant.id, email: apprenant.email, role: 'apprenant' });
    const { mot_de_passe: _, ...apprenantSansMdp } = apprenant;
    return { data: apprenantSansMdp, success: true, token, role: 'apprenant' };
  }

  // ── MOT DE PASSE OUBLIÉ (Génération de Token) ────────────────
  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email requis');

    const apprenant = await this.repo.findOne({ where: { email } });
    if (!apprenant) {
      throw new NotFoundException('Aucun compte trouvé avec cet email.');
    }

    const { randomUUID } = require('crypto');
    const token = randomUUID();
    apprenant.reset_token = token;
    await this.repo.save(apprenant);

    const resetLink = `http://localhost:5173/?reset_token=${token}&role=apprenant`;

    // Send email
    await this.emailService.sendForgotPasswordEmail({
      prenom: apprenant.prenom || '',
      nom: apprenant.nom || '',
      email: apprenant.email,
      resetLink,
    });

    return { message: 'Un email contenant le lien de réinitialisation vous a été envoyé.' };
  }

  // ── RÉINITIALISATION DE MOT DE PASSE (Validation) ─────────────
  async resetPassword(token: string, nouveau_mdp: string) {
    if (!token) throw new BadRequestException('Token invalide ou manquant');
    if (!nouveau_mdp || nouveau_mdp.length < 8 || !/[A-Z]/.test(nouveau_mdp) || !/[0-9]/.test(nouveau_mdp)) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule et un chiffre.');
    }

    const apprenant = await this.repo.findOne({ where: { reset_token: token } });
    if (!apprenant) {
      throw new BadRequestException('Token expiré ou invalide.');
    }

    apprenant.mot_de_passe = await bcrypt.hash(nouveau_mdp, 10);
    apprenant.reset_token = ''; // Consume token
    await this.repo.save(apprenant);

    return { message: 'Votre mot de passe a bien été réinitialisé.' };
  }

  // ── CONFIRMER SESSION (Depuis Apprenant UI) ──
  async confirmSession(id: number, payload: any): Promise<Apprenant> {
    const apprenant = await this.findOne(id);
    const session = await this.sessionRepo.findOne({ where: { id: payload.session_id } });

    apprenant.session_id = payload.session_id;
    apprenant.formation = payload.formation;
    apprenant.statut = "En attente";
    apprenant.date_inscription = new Date().toISOString().split('T')[0];
    
    if (payload.reservations_futures) {
      apprenant.reservations_futures = payload.reservations_futures;
    }

    const saved = await this.repo.save(apprenant);

    if (session && apprenant.email) {
      await this.emailService.sendSessionConfirmationEmail(apprenant, session).catch(err => console.error("Email err:", err));
    }
    
    return saved;
  }
}