const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Configuração do banco de dados
const pool = new Pool({
  user: "postgres",
  password: "True@#012987",
  host: "34.95.129.119",
  port: 5432,
  database: "treatments",
  ssl: false,
});

async function runMigration() {
  try {
    // Lê o arquivo de migração
    const migrationFile = path.join(
      process.cwd(),
      "lib/db/migrations/007_add_unique_order_id.sql"
    );
    const migrationSql = fs.readFileSync(migrationFile, "utf8");

    // Executa a migração
    console.log("Iniciando migração...");
    await pool.query(migrationSql);
    console.log("Migração concluída com sucesso!");

    // Verifica se a restrição foi criada
    const checkConstraint = `
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'treatments' 
      AND constraint_name = 'treatments_order_id_unique';
    `;
    const result = await pool.query(checkConstraint);

    console.log("\nRestrições criadas:");
    result.rows.forEach((row) => {
      console.log(`- ${row.constraint_name} na tabela ${row.table_name}`);
    });
  } catch (error) {
    console.error("Erro ao executar migração:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
