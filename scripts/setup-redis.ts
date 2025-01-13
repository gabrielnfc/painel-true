import db from '../lib/db';

async function setupIndexes() {
  try {
    // Criar índices necessários
    console.log('Criando índices...');
    
    // Exemplo de criação de índice
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status 
      ON orders(status);
    `);
    
    console.log('Índices criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar índices:', error);
    process.exit(1);
  }
}

setupIndexes(); 