import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cours')
export class Cours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formation: string;

  @Column()
  titre: string;

  @Column({ default: 'Autre' })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  chemin_fichier: string | null;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column()
  ajoute_par: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_ajout: Date;
}
