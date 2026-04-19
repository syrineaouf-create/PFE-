const fs = require('fs');
let fileStr = fs.readFileSync('src/sessions/session.service.ts', 'utf8');

const regex = /if \(targets\.length === 0\) \{[\s\S]*?console\.log\(`\[Smart Alert\] 🔔 Email Envoyé à \${user\.email} ! Lisez-le ici: \${nodemailer\.getTestMessageUrl\(info\)}`\);\s*\}\s*\}/;

const replacement = `if (targets.length === 0) {
        console.log(\`[Smart Alert] Aucun candidat en attente pour \${session.formation}.\`);
        return;
    }
    console.log(\`[Smart Alert] \${targets.length} candidat(s) trouvé(s). Envoi des emails via EmailService...\`);
    
    for (const user of targets) {
       await this.emailService.sendSmartAlertEmail({ 
           prenom: user.prenom || '', 
           nom: user.nom || '', 
           email: user.email 
       }, session as any);
    }
  }`;

if (regex.test(fileStr)) {
    fileStr = fileStr.replace(regex, replacement);
    fs.writeFileSync('src/sessions/session.service.ts', fileStr);
    console.log("Successfully replaced email logic!");
} else {
    console.log("Regex didn't match.");
}
