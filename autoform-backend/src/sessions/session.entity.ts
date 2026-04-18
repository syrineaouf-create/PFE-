import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formation: string; // Titre de la formation

  @Column({ nullable: true })
  formation_id: number; // Référence à la formation

  @Column({ type: 'date' })
  date_debut: string;

  @Column({ type: 'date' })
  date_fin: string;

  @Column({ nullable: true })
  formateur: string;

  @Column({ nullable: true })
  lieu: string;

  @Column({ default: 10 })
  places: number;

  @Column({ default: 0 })
  inscrits: number;

  @Column({ default: 'Planifiée' })
  statut: string; // 'Planifiée' | 'En cours' | 'Terminée' | 'Annulée'

  @Column({ type: 'simple-json', nullable: true })
  jours_appel: string[];

  @CreateDateColumn()
  created_at: Date;
}
