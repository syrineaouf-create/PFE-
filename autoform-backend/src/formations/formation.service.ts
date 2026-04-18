import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formation } from './formation.entity';
import { Formateur } from '../formateurs/formateur.entity';
import { Apprenant } from '../apprenants/apprenant.entity';

@Injectable()
export class FormationsService {
  constructor(
    @InjectRepository(Formation)
    private readonly repo: Repository<Formation>,
    @InjectRepository(Apprenant)
    private readonly apprenantRepo: Repository<Apprenant>,
    @InjectRepository(Formateur)
    private readonly formateurRepo: Repository<Formateur>,
  ) {}

  async create(data: Partial<Formation>) {
    if (data.formateur) {
      const fmt = data.formateur;
      const allFormateurs = await this.formateurRepo.find();
      const mapped = allFormateurs.find(f =>
        `${f.prenom} ${f.nom}`.trim() === fmt.trim() ||
        `${f.nom} ${f.prenom}`.trim() === fmt.trim()
      );
      if (mapped) {
        if (mapped.statut !== 'Actif') {
          throw new BadRequestException(`Impossible d'assigner : le formateur ${fmt} n'est pas actif.`);
        }
        if (data.titre && (!mapped.specialite || !mapped.specialite.includes(data.titre))) {
          throw new BadRequestException(`Le formateur ${fmt} n'a pas la spécialité requise ("${data.titre}").`);
        }
      }
    }

    const newFormation = this.repo.create(data);
    return await this.repo.save(newFormation);
  }

  async findAll() {
    const formations = await this.repo.find();

    const data = await Promise.all(formations.map(async (f) => {
      const count = await this.apprenantRepo.count({
        where: { formation: f.titre, paiement: 'Payé', statut: 'En cours' }
      });
      f.apprenants = count;
      return f;
    }));

    return { data };
  }

  async findOne(id: number) {
    const formation = await this.repo.findOne({ where: { id } });
    if (!formation) throw new NotFoundException(`Formation #${id} not found`);
    return formation;
  }

  async update(id: number, data: Partial<Formation>) {
    const formation = await this.findOne(id);

    if (data.formateur) {
      const fmt = data.formateur;
      const allFormateurs = await this.formateurRepo.find();
      const mapped = allFormateurs.find(f =>
        `${f.prenom} ${f.nom}`.trim() === fmt.trim() ||
        `${f.nom} ${f.prenom}`.trim() === fmt.trim()
      );
      if (mapped) {
        if (mapped.statut !== 'Actif') {
          throw new BadRequestException(`Impossible d'assigner : le formateur ${fmt} n'est pas actif.`);
        }
        const checkTitre = data.titre || formation.titre;
        if (checkTitre && (!mapped.specialite || !mapped.specialite.includes(checkTitre))) {
          throw new BadRequestException(`Le formateur ${fmt} n'a pas la spécialité requise ("${checkTitre}").`);
        }
      }
    }

    await this.repo.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: number) {
    const formation = await this.findOne(id);
    await this.repo.remove(formation);
    return { success: true };
  }
}
