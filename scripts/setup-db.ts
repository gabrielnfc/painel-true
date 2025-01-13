import dotenv from 'dotenv';
import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

async function setupDatabase() {
  try {
    // Lê o arquivo SQL
    const sqlFile = path.join(process.cwd(), 'lib/db/schema.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');

    // Executa as queries
    console.log('Iniciando setup do banco de dados...');
    await pool.query(sqlContent);
    console.log('Setup do banco de dados concluído com sucesso!');

  } catch (error) {
    console.error('Erro ao executar setup do banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 