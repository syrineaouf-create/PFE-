const nodemailer = require('nodemailer');

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'waialyscontact@gmail.com',
      pass: 'ekgbshdtuzvttnwd',
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP OK !');

    await transporter.sendMail({
      from: '"Waialys Formation" <waialyscontact@gmail.com>',
      to: 'waialyscontact@gmail.com', // test: send to self
      subject: 'Test envoi Waialys',
      text: 'Si vous recevez ceci, le SMTP fonctionne !',
    });
    console.log('✅ Email de test envoyé !');
  } catch (err) {
    console.error('❌ Erreur SMTP:', err.message);
    console.error('Code:', err.code);
    console.error('Response:', err.response);
  }
}

test();
