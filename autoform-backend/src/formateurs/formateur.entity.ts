import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('formateurs')
export class Formateur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nom: string;

  @Column({ nullable: true })
  prenom: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  email_perso: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  specialite: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ default: 'Actif' })
  statut: string; // 'Actif' | 'Inactif'

  @Column({ nullable: true })
  mot_de_passe: string;

  @Column({ nullable: true })
  image_path: string;

  @Column({ nullable: true })
  reset_token: string;
}