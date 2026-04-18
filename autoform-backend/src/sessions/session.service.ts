import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      return await this.repo.save(session);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Erreur lors de la sauvegarde de la session');
    }
  }

  async findAll(): Promise<{ data: Session[]; total: number }> {
    const data = await this.repo.find({ order: { date_debut: 'ASC' } });

    // Recalculer le vrai nombre d'inscrits depuis la table apprenants
    for (const session of data) {
      const realCount = await this.apprenantRepo.count({ where: { session_id: session.id } });
      if (session.inscrits !== realCount) {
        session.inscrits = realCount;
        await this.repo.save(session); // corriger le compteur en base
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
