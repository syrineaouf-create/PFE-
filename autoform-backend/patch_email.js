const fs = require('fs');

const codeToAppend = `
  // ===================================================================================================
  // Smart Email Alert (Nouvelle Session Disponible)
  // ===================================================================================================
  async sendSmartAlertEmail(apprenant: any, session: any): Promise<void> {
    const subject = "Nouvelle Session Disponible : " + session.formation;
    const html = \`
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f1c3f;">
         <h2>Bonjour \${apprenant.prenom || apprenant.nom},</h2>
         <p>Vous avez active une alerte pour la formation <strong>\${session.formation}</strong>.</p>
         <p>Nous avons le plaisir de vous informer qu'une nouvelle session vient d'etre ouverte !</p>
         <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Date :</strong> Du \${new Date(session.date_debut).toLocaleDateString('fr-FR')} au \${new Date(session.date_fin).toLocaleDateString('fr-FR')}<br/>
            <strong>Mode :</strong> \${session.mode_formation || 'Campus'}
         </div>
         <p>Connectez-vous rapidement a votre espace apprenant pour confirmer votre inscription.</p>
      </div>
    \`;

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
}
`;

const fileStr = fs.readFileSync('src/email/email.service.ts', 'utf8');
const modified = fileStr.replace(/}\s*$/, codeToAppend);
fs.writeFileSync('src/email/email.service.ts', modified);
console.log("Email Service patched!");
