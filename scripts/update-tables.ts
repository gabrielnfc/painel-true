require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function updateTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Iniciando atualização das tabelas...');

    const client = await pool.connect();
    
    try {
      // Lê e executa o arquivo SQL de alteração da tabela treatments
      const alterTreatmentsSql = fs.readFileSync(
        path.join(__dirname, '../lib/db/migrations/002_alter_treatments.sql'),
        'utf8'
      );
      
      await client.query(alterTreatmentsSql);
      console.log('Tabelas atualizadas com sucesso!');
    } finally {
      client.release();
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar tabelas:', error);
    process.exit(1);
  }
}

updateTables(); 