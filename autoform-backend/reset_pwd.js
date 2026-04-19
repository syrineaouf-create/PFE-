const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function run() {
  const pass = await bcrypt.hash('Waialys2026', 10);
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'plateform_db',
    password: 'postgres',
    port: 5433
  });
  await client.connect();
  const res = await client.query('UPDATE apprenants SET mot_de_passe = $1 WHERE email = $2', [pass, 'syrine.aouf@polytechnicien.tn']);
  console.log('Password forced updated to Waialys2026. Rows altered:', res.rowCount);
  await client.end();
}

run().catch(console.error);
