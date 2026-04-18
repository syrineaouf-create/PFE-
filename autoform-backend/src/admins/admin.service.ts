import { Injectable, OnModuleInit, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private repo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    // Injecter un admin par défaut si la table est vide
    const count = await this.repo.count();
    if (count === 0) {
      const defaultAdmin = this.repo.create({
        nom: 'Administrateur',
        prenom: 'Super',
        email: 'admin@waialys.tn',
        mot_de_passe: await bcrypt.hash('admin2026', 10),
      });
      await this.repo.save(defaultAdmin);
      console.log('✅ Compte Administrateur par défaut créé : admin@waialys.tn / admin2026');
    }
  }

  // ── AUTH ──────────────────────────────────────────────────
  async login(email: string, mot_de_passe: string) {
    const admin = await this.repo.findOne({ where: { email } });
    if (!admin || !(await bcrypt.compare(mot_de_passe, admin.mot_de_passe))) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    const token = this.jwtService.sign({ id: admin.id, email: admin.email, role: 'admin' });
    const { mot_de_passe: _, ...adminData } = admin;
    return { data: adminData, success: true, token, role: 'admin' };
  }

  // ── FORGOT PASSWORD ───────────────────────────────────────
  async forgotPassword(email: string) {
    if (!email) throw new BadRequestException('Email requis');

    const admin = await this.repo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException('Compte introuvable.');
    }

    const { randomUUID } = require('crypto');
    const token = randomUUID();
    admin.reset_token = token;
    await this.repo.save(admin);

    const resetLink = `http://localhost:5173/?reset_token=${token}&role=admin`;
    
    // Simulate email as we didn't inject emailService (to keep it light, or we could inject it if needed)
    console.log(`📧 [SIMULATION] Lien de réinitialisation Admin : ${resetLink}`);

    return { message: 'Un e-mail contenant le lien de réinitialisation vous a été envoyé.' };
  }

  // ── RESET PASSWORD ────────────────────────────────────────
  async resetPassword(token: string, nouveau_mdp: string) {
    if (!token) throw new BadRequestException('Token invalide ou manquant');
    if (!nouveau_mdp || nouveau_mdp.length < 8 || !/[A-Z]/.test(nouveau_mdp) || !/[0-9]/.test(nouveau_mdp)) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule et un chiffre.');
    }

    const admin = await this.repo.findOne({ where: { reset_token: token } });
    if (!admin) {
      throw new BadRequestException('Token expiré ou invalide.');
    }

    admin.mot_de_passe = await bcrypt.hash(nouveau_mdp, 10);
    admin.reset_token = ''; // Consume token
    await this.repo.save(admin);

    return { message: 'Votre mot de passe a bien été réinitialisé.' };
  }
}
