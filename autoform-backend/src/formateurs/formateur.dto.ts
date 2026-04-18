import { IsString, IsOptional, IsEmail } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateFormateurDto {
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
  @IsEmail()
  email_perso?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  specialite?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  mot_de_passe?: string;
}

export class UpdateFormateurDto extends PartialType(CreateFormateurDto) {}