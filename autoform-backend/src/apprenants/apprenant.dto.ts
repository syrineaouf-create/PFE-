import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateApprenantDto {
  @IsOptional()
  @IsNumber()
  apprenant_id?: number;

  @IsOptional()
  @IsNumber()
  session_id?: number;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  sexe?: string;

  @IsOptional()
  @IsString()
  profil_candidat?: string;

  @IsOptional()
  @IsString()
  formation?: string;

  @IsOptional()
  @IsString()
  mode_formation?: string;

  @IsOptional()
  @IsNumber()
  score_tp?: number;

  @IsOptional()
  @IsNumber()
  score_theorique?: number;

  @IsOptional()
  @IsNumber()
  taux_presence?: number;

  @IsOptional()
  absences?: string[];

  @IsOptional()
  @IsString()
  date_inscription?: string;

  @IsOptional()
  @IsNumber()
  reussite?: number;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  paiement?: string;

  @IsOptional()
  mot_de_passe?: string;

  @IsOptional()
  reservations_futures?: any[];

  @IsOptional()
  historique_formations?: any[];

  @IsOptional()
  compte_actif?: boolean;

  @IsOptional()
  date_activation?: Date;
}

export class UpdateApprenantDto extends PartialType(CreateApprenantDto) {}