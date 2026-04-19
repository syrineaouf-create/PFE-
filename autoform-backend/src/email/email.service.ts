import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null;

  constructor() {
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: false,
        auth: { user, pass },
      });
    } else {
      // Mode développement : log dans la console, pas d'envoi réel
      this.transporter = null;
      this.logger.warn('⚠ Variables MAIL_USER / MAIL_PASS non configurées. Les emails seront simulés en console.');
    }
  }

  async sendWelcomeEmail(apprenant: {
    prenom: string;
    nom: string;
    email: string;
    formation: string;
  }): Promise<void> {
    const subject = `Waialys Formation — Confirmation de votre inscription`;
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,28,63,0.08); }
          .header { background: linear-gradient(135deg, #0f1c3f 0%, #1a2d5a 100%); padding: 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: 700; color: #c8a96e; }
          .logo span { color: #ffffff; }
          .header-sub { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 6px; }
          .body { padding: 40px; }
          .greeting { font-size: 22px; font-weight: 700; color: #0f1c3f; margin-bottom: 16px; }
          .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
          .highlight { background: #f5edd8; border-left: 4px solid #c8a96e; padding: 16px 20px; border-radius: 8px; margin: 24px 0; }
          .highlight strong { color: #0f1c3f; font-size: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
          .info-item { background: #f4f6fb; padding: 14px 18px; border-radius: 10px; }
          .info-label { font-size: 11px; color: #8892a4; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .info-value { font-size: 14px; font-weight: 600; color: #0f1c3f; }
          .status-badge { display: inline-block; background: #fff8e1; color: #b45309; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 700; margin: 8px 0; }
          .footer { background: #0f1c3f; padding: 24px 40px; text-align: center; }
          .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
          .footer a { color: #c8a96e; text-decoration: none; }
          .section-title { font-size: 13px; font-weight: 700; color: #0f1c3f; text-transform: uppercase; letter-spacing: 0.08em; margin: 28px 0 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Waialys<span> Formation</span></div>
            <div class="header-sub">Centre de Formation Professionnelle</div>
          </div>
          <div class="body">
            <div class="greeting">Bonjour ${apprenant.prenom} ${apprenant.nom},</div>
            <p class="text">
              Nous avons bien reçu votre demande d'inscription à <strong>Waialys Formation</strong>. 
              Votre dossier est actuellement en cours d'examen par notre équipe administrative.
            </p>

            <div class="highlight">
              <strong>⏳ Statut : En attente de validation</strong><br>
              <span style="color: #6b7280; font-size: 13px; margin-top: 6px; display: block;">
                Vous recevrez un email de confirmation dès que votre accès sera activé par notre équipe.
              </span>
            </div>

            <div class="section-title">Récapitulatif de votre inscription</div>
            <table style="width:100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 12px; color: #8892a4; font-weight: 700; text-transform: uppercase; width: 40%;">Nom complet</td>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 14px; color: #0f1c3f; font-weight: 600;">${apprenant.prenom} ${apprenant.nom}</td>
              </tr>
              <tr><td colspan="2" style="height: 6px;"></td></tr>
              <tr>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 12px; color: #8892a4; font-weight: 700; text-transform: uppercase;">Email</td>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 14px; color: #0f1c3f; font-weight: 600;">${apprenant.email}</td>
              </tr>
              <tr><td colspan="2" style="height: 6px;"></td></tr>
              <tr>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 12px; color: #8892a4; font-weight: 700; text-transform: uppercase;">Formation</td>
                <td style="padding: 10px 14px; background: #f4f6fb; border-radius: 8px; font-size: 14px; color: #0f1c3f; font-weight: 600;">${apprenant.formation || 'Non précisé'}</td>
              </tr>
            </table>

            <div class="section-title" style="margin-top: 32px;">Pourquoi Waialys Formation ?</div>
            <p class="text">
              Waialys Formation est un centre spécialisé dans les formations en <strong>Ingénierie & Automatisme Industriel</strong>. 
              Nos programmes sont dispensés par des experts du domaine sur des équipements réels et à jour avec les exigences de l'industrie 4.0.
            </p>
            <ul style="color: #6b7280; font-size: 14px; line-height: 2; padding-left: 20px;">
              <li>✅ Formations certifiantes reconnues</li>
              <li>✅ Formateurs experts en industrie</li>
              <li>✅ Équipements professionnels réels</li>
              <li>✅ Suivi personnalisé de chaque apprenant</li>
              <li>✅ Accès à un portail numérique dédié</li>
            </ul>

            <p class="text" style="margin-top: 24px;">
              Pour toute question, contactez-nous à l'adresse : 
              <a href="mailto:contact@waialys.tn" style="color: #c8a96e; font-weight: 600;">contact@waialys.tn</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Waialys Formation. Tous droits réservés.</p>
            <p style="margin-top: 6px;"><a href="mailto:contact@waialys.tn">contact@waialys.tn</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || '"Waialys Formation" <contact@waialys.tn>',
          to: apprenant.email,
          subject,
          html,
        });
        this.logger.log(`✅ Email de bienvenue envoyé à ${apprenant.email}`);
      } catch (err) {
        this.logger.error(`❌ Erreur envoi email à ${apprenant.email} : ${err.message}`);
      }
    } else {
      // Simulation console en mode dev
      this.logger.log(`📧 [SIMULATION] Email envoyé à ${apprenant.email} — Sujet: ${subject}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Email credentials formateur (envoi des identifiants de connexion)
  // ─────────────────────────────────────────────────────────────
  async sendFormateurCredentials(formateur: {
    prenom: string;
    nom: string;
    email: string;
    emailPro?: string;
    tempPassword: string;
    specialite?: string;
  }): Promise<void> {
    const subject = `Waialys Formation — Vos identifiants de connexion`;
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,28,63,0.08); }
          .header { background: linear-gradient(135deg, #0f1c3f 0%, #1a2d5a 100%); padding: 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: 700; color: #c8a96e; }
          .logo span { color: #ffffff; }
          .body { padding: 40px; }
          .greeting { font-size: 22px; font-weight: 700; color: #0f1c3f; margin-bottom: 16px; }
          .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
          .creds-box { background: #0f1c3f; border-radius: 12px; padding: 28px 32px; margin: 28px 0; }
          .cred-row { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
          .cred-row:last-child { margin-bottom: 0; }
          .cred-label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; min-width: 90px; }
          .cred-value { font-size: 15px; font-weight: 700; color: #c8a96e; letter-spacing: 0.04em; }
          .warning { background: #fff8e1; border-left: 4px solid #c8a96e; padding: 14px 18px; border-radius: 8px; margin: 24px 0; color: #6b7280; font-size: 13px; line-height: 1.6; }
          .footer { background: #0f1c3f; padding: 24px 40px; text-align: center; }
          .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
          .footer a { color: #c8a96e; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Waialys<span> Formation</span></div>
          </div>
          <div class="body">
            <div class="greeting">Bonjour ${formateur.prenom} ${formateur.nom},</div>
            <p class="text">
              Votre compte formateur sur la plateforme <strong>Waialys Formation</strong> a été créé.
              Vous trouverez ci-dessous vos identifiants de connexion personnels et confidentiels.
            </p>

            <div class="creds-box">
              <div style="font-size:12px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:20px;">Vos identifiants</div>
              <table style="width:100%; border-collapse:collapse;">
                <tr style="margin-bottom:16px;">
                  <td style="padding:10px 0; font-size:11px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.08em; width:120px;">Identifiant connexion</td>
                  <td style="padding:10px 0; font-size:15px; font-weight:700; color:#c8a96e;">${formateur.emailPro || formateur.email}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; font-size:11px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.08em;">Mot de passe temp.</td>
                  <td style="padding:10px 0; font-size:18px; font-weight:700; color:#ffffff; letter-spacing:0.15em; font-family:monospace;">${formateur.tempPassword}</td>
                </tr>
              </table>
            </div>

            <div class="warning">
              ⚠️ <strong>Important :</strong> Ce mot de passe est temporaire et personnel. Veuillez le modifier dès votre première connexion depuis votre espace <strong>Mon Compte → Changer le mot de passe</strong>.<br><br>
              Ne partagez jamais vos identifiants avec quiconque, y compris l'administration.
            </div>

            <p class="text">
              Pour vous connecter, rendez-vous sur la plateforme, sélectionnez <strong>"👨‍🏫 Formateur"</strong> et saisissez vos identifiants.
            </p>
            ${formateur.specialite ? `<p class="text">Votre spécialité enregistrée : <strong>${formateur.specialite}</strong></p>` : ''}
            <p class="text">Pour toute assistance, contactez-nous : <a href="mailto:contact@waialys.tn" style="color:#c8a96e; font-weight:600;">contact@waialys.tn</a></p>
          </div>
          <div class="footer">
            <p>© 2026 Waialys Formation. Tous droits réservés.</p>
            <p style="margin-top:6px;"><a href="mailto:contact@waialys.tn">contact@waialys.tn</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || '"Waialys Formation" <contact@waialys.tn>',
          to: formateur.email,
          subject,
          html,
        });
        this.logger.log(`✅ Credentials formateur envoyés à ${formateur.email}`);
      } catch (err) {
        this.logger.error(`❌ Erreur envoi credentials à ${formateur.email} : ${err.message}`);
      }
    } else {
      this.logger.log(`📧 [SIMULATION] Credentials formateur sur boite perso ${formateur.email} | ID Waialys: ${formateur.emailPro || formateur.email} | MDP temp: ${formateur.tempPassword}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Email "Mot de passe oublié"
  // ─────────────────────────────────────────────────────────────
  async sendForgotPasswordEmail(user: {
    prenom: string;
    nom: string;
    email: string;
    resetLink: string;
  }): Promise<void> {
    const subject = `Waialys Formation — Réinitialisation de votre mot de passe`;
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,28,63,0.08); }
          .header { background: linear-gradient(135deg, #0f1c3f 0%, #1a2d5a 100%); padding: 40px; text-align: center; }
          .logo { font-size: 28px; font-weight: 700; color: #c8a96e; }
          .logo span { color: #ffffff; }
          .body { padding: 40px; }
          .greeting { font-size: 22px; font-weight: 700; color: #0f1c3f; margin-bottom: 16px; }
          .text { color: #6b7280; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
          .creds-box { background: #0f1c3f; border-radius: 12px; padding: 28px 32px; margin: 28px 0; }
          .warning { background: #fff8e1; border-left: 4px solid #c8a96e; padding: 14px 18px; border-radius: 8px; margin: 24px 0; color: #6b7280; font-size: 13px; line-height: 1.6; }
          .footer { background: #0f1c3f; padding: 24px 40px; text-align: center; }
          .footer p { color: rgba(255,255,255,0.4); font-size: 12px; margin: 0; }
          .footer a { color: #c8a96e; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Waialys<span> Formation</span></div>
          </div>
          <div class="body">
            <div class="greeting">Bonjour ${user.prenom} ${user.nom},</div>
            <p class="text">
              Vous recevez ce courriel car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
              Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${user.resetLink}" style="display: inline-block; background-color: #5a75eb; color: #ffffff; padding: 14px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px rgba(90, 117, 235, 0.25);">
                Réinitialiser le mot de passe
              </a>
            </div>

            <div class="warning">
              ⚠️ <strong>Important :</strong> Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.
            </div>

            <p class="text">Pour toute assistance, contactez-nous : <a href="mailto:contact@waialys.tn" style="color:#c8a96e; font-weight:600;">contact@waialys.tn</a></p>
          </div>
          <div class="footer">
            <p>© 2026 Waialys Formation. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || '"Waialys Formation" <contact@waialys.tn>',
          to: user.email,
          subject,
          html,
        });
        this.logger.log(`✅ Email "Mot de passe oublié" envoyé à ${user.email}`);
      } catch (err) {
        this.logger.error(`❌ Erreur envoi email mdp oublié à ${user.email} : ${err.message}`);
      }
    } else {
      this.logger.log(`📧 [SIMULATION] Mot de passe oublié pour ${user.email} | Lien: ${user.resetLink}`);
    }
  }

  // ===================================================================================================
  // Smart Email Alert (Nouvelle Session Disponible)
  // ===================================================================================================
  async sendSmartAlertEmail(apprenant: any, session: any): Promise<void> {
    const subject = "Nouvelle Session Disponible : " + session.formation;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f1c3f;">
         <h2>Bonjour ${apprenant.prenom || apprenant.nom},</h2>
         <p>Vous avez active une alerte pour la formation <strong>${session.formation}</strong>.</p>
         <p>Nous avons le plaisir de vous informer qu'une nouvelle session vient d'etre ouverte !</p>
         <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Date :</strong> Du ${new Date(session.date_debut).toLocaleDateString('fr-FR')} au ${new Date(session.date_fin).toLocaleDateString('fr-FR')}<br/>
            <strong>Mode :</strong> ${session.mode_formation || 'Campus'}
         </div>
         <p>Connectez-vous rapidement a votre espace apprenant pour confirmer votre inscription.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || '"Waialys Formation" <contact@waialys.tn>',
          to: apprenant.email,
          subject,
          html,
        });
        this.logger.log("Alerte intelligente envoyee a " + apprenant.email);
      } catch (err) {
        this.logger.error("Erreur envoi alerte intelligente a " + apprenant.email);
      }
    }
  }

  // ===================================================================================================
  // Confirmation d'inscription (S'inscrire depuis Waitlist)
  // ===================================================================================================
  async sendSessionConfirmationEmail(apprenant: any, session: any): Promise<void> {
    const subject = "Confirmation de Pré-inscription : " + session.formation;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f1c3f;">
         <h2>Bonjour ${apprenant.prenom || apprenant.nom},</h2>
         <p>Votre demande d'inscription pour la session de <strong>${session.formation}</strong> a bien été prise en compte !</p>
         <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Détails de la Session :</strong><br/>
            📍 Du ${new Date(session.date_debut).toLocaleDateString('fr-FR')} au ${new Date(session.date_fin).toLocaleDateString('fr-FR')}
         </div>
         <p><strong>Prochaine étape :</strong> Pour finaliser et réserver officiellement votre place, veuillez vous présenter au centre pour valider votre paiement.</p>
         <p>À très bientôt chez Waialys !</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || '"Waialys Formation" <contact@waialys.tn>',
          to: apprenant.email,
          subject,
          html,
        });
        this.logger.log("Email de confirmation envoyee a " + apprenant.email);
      } catch (err) {
        this.logger.error("Erreur envoi email de confirmation a " + apprenant.email);
      }
    }
  }
}

