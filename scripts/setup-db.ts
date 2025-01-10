require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required in environment variables');
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to database!');

    // Lista todos os arquivos de migração
    const migrationsDir = path.join(process.cwd(), 'lib', 'db', 'migrations');
    const migrationFiles = await fs.readdir(migrationsDir);

    // Ordena os arquivos para garantir a execução na ordem correta
    const sortedMigrationFiles = migrationFiles
      .filter((file: string) => file.endsWith('.sql'))
      .sort();

    // Executa cada migração em sequência
    for (const file of sortedMigrationFiles) {
      console.log(`Reading migration file: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = await fs.readFile(migrationPath, 'utf8');

      console.log(`Running migration: ${file}`);
      await client.query(migrationSql);
      console.log(`Migration ${file} completed successfully!`);
    }

    client.release();
    await pool.end();
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 