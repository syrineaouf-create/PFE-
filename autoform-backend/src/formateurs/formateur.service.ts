import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Formateur } from './formateur.entity';
import { CreateFormateurDto, UpdateFormateurDto } from './formateur.dto';
import { Formation } from '../formations/formation.entity';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class FormateursService {
  constructor(
    @InjectRepository(Formateur)
    private readonly repo: Repository<Formateur>,
    @InjectRepository(Formation)
    private readonly formationRepo: Repository<Formation>,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  // Génère un mot de passe temporaire (jamais visible par l'admin)
  private generateTempPassword(length = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // ── CREATE ──────────────────────────────────────────────────
  async create(dto: CreateFormateurDto): Promise<Formateur> {
    // Générer un mot de passe temporaire — l'admin ne le voit pas
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const formateur = this.repo.create({ ...dto, mot_de_passe: hashedPassword });
    const saved = await this.repo.save(formateur);
    
    if (saved.specialite && saved.statut === 'Actif') {
      const formation = await this.formationRepo.findOne({ where: { titre: saved.specialite } });
      if (formation) {
        formation.formateur = `${saved.prenom || ''} ${saved.nom || ''}`.trim();
        await this.formationRepo.save(formation);
      }
    }

    // Envoyer les identifiants sur la boîte personnelle si renseignée
    // L'admin ne verra JAMAIS le mot de passe
    const emailEnvoi = saved.email_perso || saved.email;
    if (emailEnvoi) {
      this.emailService.sendFormateurCredentials({
        prenom: saved.prenom || '',
        nom: saved.nom || '',
        email: emailEnvoi, // Destinataire du mail (ex: Gmail perso)
        emailPro: saved.email, // Login professionnel
        tempPassword,
        specialite: saved.specialite,
      }).catch(() => {/* non bloquant */});
    }
    
    return saved;
  }

  // ── READ ALL ─────────────────────────────────────────────────
  async findAll(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? [
          { nom: Like(`%${search}%`) },
          { prenom: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { specialite: Like(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  // ── READ ONE ─────────────────────────────────────────────────
  async findOne(id: number): Promise<Formateur> {
    const formateur = await this.repo.findOne({ where: { id } });
    if (!formateur) throw new NotFoundException(`Formateur #${id} introuvable`);
    return formateur;
  }

  // ── UPDATE ───────────────────────────────────────────────────
  async update(id: number, dto: UpdateFormateurDto): Promise<Formateur> {
    const formateur = await this.findOne(id);
    Object.assign(formateur, dto);
    const saved = await this.repo.save(formateur);

    if (saved.specialite && saved.statut === 'Actif') {
      const formation = await this.formationRepo.findOne({ where: { titre: saved.specialite } });
      if (formation) {
        formation.formateur = `${saved.prenom || ''} ${saved.nom || ''}`.trim();
        await this.formationRepo.save(formation);
      }
    }

    return saved;
  }

  // ── DELETE ───────────────────────────────────────────────────
  async remove(id: number): Promise<{ message: string }> {
    const formateur = await this.findOne(id);
    await this.repo.remove(formateur);
    return { message: `Formateur #${id} supprimé avec succès` };
  }

  // ── STATS ────────────────────────────────────────────────────
  async getStats() {
    const total = await this.repo.count();
    const actifs = await this.repo.count({ where: { statut: 'Actif' } });
    return { total, actifs };
  }

  // ── LOGIN ────────────────────────────────────────────────────
  async login(email: string, mdp: string) {
    if (!email || !mdp) throw new BadRequestException('Email et mot de passe requis');
    const formateur = await this.repo.findOne({ where: { email } });
    if (!formateur || !(await bcrypt.compare(mdp, formateur.mot_de_passe))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const token = this.jwtService.sign({ id: formateur.id, email: formateur.email, role: 'formateur' });
    const { mot_de_passe: _, ...result } = formateur;
    return { data: result, success: true, token, role: 'formateur' };
  }

  // ── CHANGER MOT DE PASSE (portail formateur) ─────────────────
  async changePassword(id: number, ancienMdp: string, nouveauMdp: string): Promise<{ message: string }> {
    const formateur = await this.findOne(id);
    if (!(await bcrypt.compare(ancienMdp, formateur.mot_de_passe))) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }
    if (!nouveauMdp || nouveauMdp.length < 6) {
      throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }
    formateur.mot_de_passe = await bcrypt.hash(nouveauMdp, 10);
    await this.repo.save(formateur);
    return { message: 'Mot de passe mis à jour avec succès' };
  }

  // ── MOT DE PASSE OUBLIÉ (Génération de Token) ────────────────
  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email requis');

    // Recherche par email professionnel (waialys) OU email personnel
    const formateur = await this.repo.findOne({ 
      where: [
        { email },
        { email_perso: email }
      ] 
    });
    
    if (!formateur) {
      throw new NotFoundException('Aucun compte trouvé avec cet email.');
    }

    const { randomUUID } = require('crypto');
    const token = randomUUID();
    formateur.reset_token = token;
    await this.repo.save(formateur);

    const resetLink = `http://localhost:5173/?reset_token=${token}&role=formateur`;

    // Envoyer à l'adresse personnelle si elle existe, sinon à l'identifiant
    const emailEnvoi = formateur.email_perso || formateur.email;

    // Send email
    await this.emailService.sendForgotPasswordEmail({
      prenom: formateur.prenom || '',
      nom: formateur.nom || '',
      email: emailEnvoi,
      resetLink,
    });

    return { message: 'Un email contenant le lien de réinitialisation vous a été envoyé.' };
  }

  // ── RÉINITIALISATION DE MOT DE PASSE (Validation) ─────────────
  async resetPassword(token: string, nouveau_mdp: string) {
    if (!token) throw new BadRequestException('Token invalide ou manquant');
    if (!nouveau_mdp || nouveau_mdp.length < 8 || !/[A-Z]/.test(nouveau_mdp) || !/[0-9]/.test(nouveau_mdp)) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule et un chiffre.');
    }

    const formateur = await this.repo.findOne({ where: { reset_token: token } });
    if (!formateur) {
      throw new BadRequestException('Token expiré ou invalide.');
    }

    formateur.mot_de_passe = await bcrypt.hash(nouveau_mdp, 10);
    formateur.reset_token = ''; // Consume token
    await this.repo.save(formateur);

    return { message: 'Votre mot de passe a bien été réinitialisé.' };
  }
}