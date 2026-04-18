const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'plateform_db' });

async function check() {
  await client.connect();
  // Check actual column names
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'apprenants' ORDER BY ordinal_position");
  console.log('Colonnes:', cols.rows.map(r => r.column_name).join(', '));
  
  // Check the compte_actif field
  const res = await client.query("SELECT id, email, compte_actif FROM apprenants WHERE email IS NOT NULL");
  console.log('\nRaw data:');
  res.rows.forEach(a => console.log(`  ID=${a.id} email=${a.email} compte_actif=${a.compte_actif} (type: ${typeof a.compte_actif})`));
  await client.end();
}
check().catch(console.error);
