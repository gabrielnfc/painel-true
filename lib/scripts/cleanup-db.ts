import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Conectando ao banco de dados:', connectionString);

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

interface CleanupResults {
  unusedTreatments: number;
  duplicateHistoryEntries: number;
}

async function analyzeCleanup(): Promise<CleanupResults> {
  console.log('\nIniciando análise de limpeza do banco...\n');

  try {
    // Contagem de tratativas não utilizadas (sem histórico de interação)
    const unusedTreatmentsQuery = `
      SELECT COUNT(DISTINCT t.id) as count
      FROM treatments t
      LEFT JOIN treatment_history th ON t.id = th.treatment_id
      WHERE t.treatment_status = 'pending'
      AND t.created_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1
        FROM treatment_history th2
        WHERE th2.treatment_id = t.id
        AND th2.action_taken IS NOT NULL
      )
    `;
    const unusedTreatmentsResult = await query(unusedTreatmentsQuery);
    const unusedTreatmentsCount = parseInt(unusedTreatmentsResult.rows[0].count);

    // Contagem de entradas duplicadas no histórico
    const duplicateHistoryQuery = `
      SELECT COUNT(*) as count
      FROM (
        SELECT th.id
        FROM treatment_history th
        INNER JOIN treatments t ON th.treatment_id = t.id
        WHERE EXISTS (
          SELECT 1
          FROM treatment_history th2
          WHERE th2.treatment_id = th.treatment_id
          AND th2.created_at = th.created_at
          AND th2.id < th.id
        )
      ) as duplicates
    `;
    const duplicateHistoryResult = await query(duplicateHistoryQuery);
    const duplicateHistoryCount = parseInt(duplicateHistoryResult.rows[0].count);

    console.log(`Tratativas não utilizadas: ${unusedTreatmentsCount}`);
    console.log(`Entradas duplicadas no histórico: ${duplicateHistoryCount}\n`);

    return {
      unusedTreatments: unusedTreatmentsCount,
      duplicateHistoryEntries: duplicateHistoryCount
    };
  } catch (error) {
    console.error('Erro durante a análise:', error);
    throw error;
  }
}

async function executeCleanup(results: CleanupResults) {
  console.log('Iniciando processo de limpeza...\n');

  try {
    // Inicia uma transação
    await query('BEGIN');

    // Remove tratativas não utilizadas
    if (results.unusedTreatments > 0) {
      // Primeiro remove o histórico
      const deleteHistoryQuery = `
        DELETE FROM treatment_history
        WHERE treatment_id IN (
          SELECT t.id
          FROM treatments t
          LEFT JOIN treatment_history th ON t.id = th.treatment_id
          WHERE t.treatment_status = 'pending'
          AND t.created_at < NOW() - INTERVAL '7 days'
          AND NOT EXISTS (
            SELECT 1
            FROM treatment_history th2
            WHERE th2.treatment_id = t.id
            AND th2.action_taken IS NOT NULL
          )
        )
      `;
      await query(deleteHistoryQuery);

      // Depois remove as tratativas
      const deleteTreatmentsQuery = `
        DELETE FROM treatments
        WHERE id IN (
          SELECT t.id
          FROM treatments t
          LEFT JOIN treatment_history th ON t.id = th.treatment_id
          WHERE t.treatment_status = 'pending'
          AND t.created_at < NOW() - INTERVAL '7 days'
          AND NOT EXISTS (
            SELECT 1
            FROM treatment_history th2
            WHERE th2.treatment_id = t.id
            AND th2.action_taken IS NOT NULL
          )
        )
      `;
      await query(deleteTreatmentsQuery);
      console.log(`Removidas ${results.unusedTreatments} tratativas não utilizadas`);
    }

    // Remove entradas duplicadas no histórico
    if (results.duplicateHistoryEntries > 0) {
      const deleteDuplicatesQuery = `
        DELETE FROM treatment_history
        WHERE id IN (
          SELECT th.id
          FROM treatment_history th
          INNER JOIN treatments t ON th.treatment_id = t.id
          WHERE EXISTS (
            SELECT 1
            FROM treatment_history th2
            WHERE th2.treatment_id = th.treatment_id
            AND th2.created_at = th.created_at
            AND th2.id < th.id
          )
        )
      `;
      await query(deleteDuplicatesQuery);
      console.log(`Removidas ${results.duplicateHistoryEntries} entradas duplicadas no histórico`);
    }

    // Commit da transação
    await query('COMMIT');
    console.log('\nLimpeza concluída com sucesso!');
  } catch (error) {
    // Rollback em caso de erro
    await query('ROLLBACK');
    console.error('Erro durante a limpeza:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Análise de Limpeza do Banco ===\n');

  try {
    // Executa a análise
    const results = await analyzeCleanup();

    // Se houver registros para limpar, pede confirmação
    if (results.unusedTreatments > 0 || results.duplicateHistoryEntries > 0) {
      console.log('Deseja prosseguir com a limpeza? (y/n)');
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y') {
          await executeCleanup(results);
        } else {
          console.log('Operação cancelada pelo usuário.');
        }
        process.exit(0);
      });
    } else {
      console.log('Nenhum registro para limpar.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Erro durante o processo:', error);
    process.exit(1);
  }
}

// Executa o script
main(); 