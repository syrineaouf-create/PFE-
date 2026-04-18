import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Cours } from './cours.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CoursService {
  constructor(
    @InjectRepository(Cours)
    private coursRepo: Repository<Cours>,
  ) {}

  async findByFormation(formation: string) {
    if (!formation) return [];
    return this.coursRepo.find({ where: { formation: ILike(`%${formation}%`) }, order: { date_ajout: 'DESC' } });
  }

  async create(data: Partial<Cours>) {
    const cours = this.coursRepo.create(data);
    await this.coursRepo.save(cours);
    return { success: true, data: cours };
  }

  async delete(id: number) {
    const cours = await this.coursRepo.findOne({ where: { id } });
    if (!cours) throw new NotFoundException('Cours introuvable');
    
    try {
      const filePath = path.join(process.cwd(), cours.chemin_fichier);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Erreur lors de la suppression du fichier:', e.message);
    }
    
    await this.coursRepo.delete(id);
    return { success: true, message: 'Cours supprimé' };
  }
}
