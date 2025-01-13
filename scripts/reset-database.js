const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");

async function resetDatabase() {
  const pool = new Pool({
    user: "postgres",
    password: "True@#012987",
    host: "34.95.129.119",
    port: 5432,
    database: "treatments",
  });

  try {
    console.log("Conectando ao banco de dados...");
    const client = await pool.connect();

    console.log("Removendo triggers...");
    await client.query(`
            DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
            DROP TRIGGER IF EXISTS update_order_progress_updated_at ON order_progress;
        `);

    console.log("Removendo função de atualização...");
    await client.query(`
            DROP FUNCTION IF EXISTS update_updated_at_column();
        `);

    console.log("Removendo tabelas existentes...");
    await client.query(`
            DROP TABLE IF EXISTS treatment_history;
            DROP TABLE IF EXISTS order_progress;
            DROP TABLE IF EXISTS treatments;
        `);

    console.log("Lendo arquivo SQL para recriar as tabelas...");
    const sqlPath = path.join(__dirname, "create_tables.sql");
    const sqlContent = await fs.readFile(sqlPath, "utf8");

    console.log("Recriando tabelas...");
    await client.query(sqlContent);

    console.log("Banco de dados resetado com sucesso!");
    client.release();
  } catch (error) {
    console.error("Erro ao resetar o banco de dados:", error);
  } finally {
    await pool.end();
  }
}

resetDatabase();
