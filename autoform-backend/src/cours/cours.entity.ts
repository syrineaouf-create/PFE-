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

  @Column({ nullable: true })
  chemin_fichier: string;

  @Column({ nullable: true })
  url: string;

  @Column()
  ajoute_par: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date_ajout: Date;
}
