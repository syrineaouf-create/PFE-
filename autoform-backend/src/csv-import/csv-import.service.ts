import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apprenant } from '../apprenants/apprenant.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    @InjectRepository(Apprenant)
    private readonly apprenantRepo: Repository<Apprenant>,
  ) { }

  async importApprenants(filePath: string): Promise<{ imported: number; skipped: number }> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Fichier CSV introuvable : ${absolutePath}`);
    }

    // Lecture manuelle du CSV sans librairie externe
    const content = fs.readFileSync(absolutePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    const rows = lines.slice(1);

    let imported = 0;
    let skipped = 0;

    for (const line of rows) {
      try {
        const values = line.split(',').map(v => v.trim().replace(/\r/g, ''));
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i]; });

        // Vérifie si apprenant_id existe déjà
        const exists = await this.apprenantRepo.findOne({
          where: { apprenant_id: parseInt(row.apprenant_id) },
        });

        if (exists) { skipped++; continue; }

        await this.apprenantRepo.save(
          this.apprenantRepo.create({
            apprenant_id: parseInt(row.apprenant_id) || null,
            age: parseInt(row.age) || null,
            sexe: row.sexe || null,
            profil_candidat: row.profil_candidat || null,
            formation: row.formation || null,
            mode_formation: row.mode_formation || null,
            score_tp: parseFloat(row.score_tp) || null,
            score_theorique: parseFloat(row.score_theorique) || null,
            taux_presence: parseFloat(row.taux_presence) || null,
            date_inscription: row.date_inscription || null,
            reussite: parseInt(row.reussite) || null,
          } as Apprenant),
        );
        imported++;
      } catch (err) {
        this.logger.error(`Erreur ligne: ${err.message}`);
        skipped++;
      }
    }

    this.logger.log(`Import terminé : ${imported} importés, ${skipped} ignorés`);
    return { imported, skipped };
  }
}