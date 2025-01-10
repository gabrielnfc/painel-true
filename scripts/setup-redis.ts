import { query } from '../lib/db';

async function setupIndexes() {
  try {
    console.log('Criando índices no PostgreSQL...');
    
    // Criar índices
    await query(`
      CREATE INDEX IF NOT EXISTS idx_treatments_order_id ON treatments(order_id);
      CREATE INDEX IF NOT EXISTS idx_treatments_dates ON treatments(new_delivery_deadline, treatment_status);
      CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments(treatment_status);
      CREATE INDEX IF NOT EXISTS idx_treatments_created_at ON treatments(created_at);
    `);

    console.log('Índices criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar índices:', error);
  }
}

// Executar setup
setupIndexes(); 