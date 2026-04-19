const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'plateform_db',
    password: 'postgres',
    port: 5433
  });
  await client.connect();
  
  const hist = JSON.stringify([{
    formation: 'Industrie 4.0',
    score_tp: 95,
    score_theorique: 98,
    certificat_fichier: '/uploads/certificats/industrie40.pdf',
    date_fin: '2026-03-01T12:00:00Z'
  }]);

  const query = `
    UPDATE apprenants 
    SET historique_formations = $1::jsonb, 
        statut = $2, 
        paiement = $3 
    WHERE email = $4
  `;

  const res = await client.query(query, [hist, 'En cours', 'Payé', 'syrine.aouf@polytechnicien.tn']);
  console.log('Restored DB history. Rows updated:', res.rowCount);
  await client.end();
}

run().catch(console.error);
