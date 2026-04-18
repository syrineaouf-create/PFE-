const { Client } = require('pg');

async function checkAdmin() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'plateform_db',
    password: 'postgres',
    port: 5433,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM admins;');
    console.log("Admin Users:");
    console.log(res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkAdmin();
