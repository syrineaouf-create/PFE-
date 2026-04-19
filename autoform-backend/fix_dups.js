const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'plateform_db', password: 'postgres', port: 5433 });
client.connect();
client.query("DELETE FROM apprenants WHERE id IN (SELECT id FROM apprenants WHERE email = 'syrine.aouf@polytechnicien.tn' ORDER BY id DESC OFFSET 1)", (err, res) => {
  if(err) console.error(err);
  else console.log('Rows deleted:', res.rowCount);
  client.end();
});
