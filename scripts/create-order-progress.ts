const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

async function createOrderProgressTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_progress (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT order_progress_order_id_key UNIQUE (order_id)
      );
    `);
    console.log('Tabela order_progress criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela order_progress:', error);
  } finally {
    await pool.end();
  }
}

createOrderProgressTable(); 