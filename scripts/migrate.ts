const { query } = require('../lib/db');
const fs = require('fs');
const path = require('path');

interface ColumnInfo {
  column_name: string;
  table_name: string;
}

async function runMigration() {
  try {
    // Lê o arquivo de migração
    const migrationFile = path.join(process.cwd(), 'lib/db/migrations/004_add_complaint_reason.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    // Executa a migração
    console.log('Iniciando migração...');
    await query(migrationSql);
    console.log('Migração concluída com sucesso!');

    // Verifica se as colunas foram criadas
    const checkColumns = `
      SELECT column_name, table_name 
      FROM information_schema.columns 
      WHERE table_name IN ('treatments', 'treatment_history') 
      AND column_name = 'complaint_reason';
    `;
    const result = await query(checkColumns);
    
    console.log('\nColunas criadas:');
    result.rows.forEach((row: ColumnInfo) => {
      console.log(`- ${row.column_name} na tabela ${row.table_name}`);
    });

  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration(); 