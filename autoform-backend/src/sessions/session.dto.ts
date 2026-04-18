import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  formation: string;

  @IsOptional()
  @IsNumber()
  formation_id?: number;

  @IsString()
  date_debut: string;

  @IsString()
  date_fin: string;

  @IsOptional()
  @IsString()
  formateur?: string;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsOptional()
  @IsNumber()
  places?: number;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  jours_appel?: string[];
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  formation?: string;

  @IsOptional()
  @IsNumber()
  formation_id?: number;

  @IsOptional()
  @IsString()
  date_debut?: string;

  @IsOptional()
  @IsString()
  date_fin?: string;

  @IsOptional()
  @IsString()
  formateur?: string;

  @IsOptional()
  @IsString()
  lieu?: string;

  @IsOptional()
  @IsNumber()
  places?: number;

  @IsOptional()
  @IsNumber()
  inscrits?: number;
  
  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  jours_appel?: string[];
}
