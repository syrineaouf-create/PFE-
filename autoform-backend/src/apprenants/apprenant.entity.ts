import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('apprenants')
export class Apprenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  apprenant_id: number;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  sexe: string;

  @Column({ nullable: true })
  profil_candidat: string;


  @Column({ nullable: true })
  formation: string;

  @Column({ nullable: true })
  session_id: number;

  @Column({ nullable: true })
  mode_formation: string;

  @Column({ type: 'float', nullable: true })
  score_tp: number;

  @Column({ type: 'float', nullable: true })
  score_theorique: number;

  @Column({ type: 'float', nullable: true })
  taux_presence: number;

  @Column({ type: 'simple-json', nullable: true })
  absences: string[];

  @Column({ nullable: true })
  date_inscription: string;

  @Column({ nullable: true })
  reussite: number;

  // Champs supplémentaires pour la gestion admin
  @Column({ nullable: true })
  nom: string;

  @Column({ nullable: true })
  prenom: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  statut: string; // 'En cours' | 'Certifié' | 'Abandonné'

  @Column({ nullable: true })
  paiement: string; // 'Payé' | 'En attente'

  @Column({ nullable: true })
  mot_de_passe: string;

  // Gestion de l'accès
  @Column({ default: false })
  compte_actif: boolean;

  @Column({ type: 'timestamp', nullable: true })
  date_activation: Date;

  // Fichier PDF ou Image du certificat
  @Column({ nullable: true })
  certificat_fichier: string;

  @Column({ nullable: true })
  cv_path: string;

  @Column({ nullable: true })
  reset_token: string;

  @Column({ type: 'simple-json', nullable: true })
  historique_formations: any[];
}