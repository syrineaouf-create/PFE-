import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('formations')
export class Formation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titre: string;

  @Column({ nullable: true })
  categorie: string;

  @Column({ nullable: true })
  duree: string;

  @Column({ type: 'float', nullable: true })
  prix: number;

  @Column({ nullable: true })
  formateur: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'Active' })
  statut: string;

  @Column({ default: 0 })
  apprenants: number;
}
