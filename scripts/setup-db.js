import pg from 'pg';
const { Client } = pg;

async function setupDatabase() {
  // First connect to postgres database to create our database
  const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'postgres123',
    database: 'postgres',
    port: 5432
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'affiliate_db'"
    );

    if (res.rows.length === 0) {
      // Database does not exist, create it
      await client.query('CREATE DATABASE affiliate_db');
      console.log('Database affiliate_db created successfully');
    } else {
      console.log('Database affiliate_db already exists');
    }

  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase(); 