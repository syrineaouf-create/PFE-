const { Client } = require('pg');

async function checkDb() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'plateform_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tablesRes.rows.map(r => r.table_name).join(', '));

    // Check row count for apprenants
    try {
      const countRes = await client.query('SELECT COUNT(*) FROM apprenants');
      console.log('Row count in apprenants table:', countRes.rows[0].count);
      
      const sample = await client.query('SELECT * FROM apprenants LIMIT 1');
      console.log('Sample row:', sample.rows[0] ? 'Data exists' : 'No data');
    } catch (e) {
      console.error('Error querying apprenants table:', e.message);
    }

  } catch (err) {
    console.error('Error connecting to database:', err.message);
  } finally {
    await client.end();
  }
}

checkDb();
