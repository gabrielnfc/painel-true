const { Pool } = require("pg");

// Configuração do banco de dados
const pool = new Pool({
  user: "postgres",
  password: "True@#012987",
  host: "34.95.129.119",
  port: 5432,
  database: "treatments",
});

async function debugTreatment(orderId) {
  const client = await pool.connect();

  try {
    console.log("=== Verificando Tratamento ===");

    // Verifica se existe o tratamento
    const treatment = await client.query(
      "SELECT * FROM treatments WHERE order_id = $1",
      [orderId]
    );

    if (treatment.rows.length > 0) {
      console.log("\nTratamento encontrado:");
      console.log(treatment.rows[0]);

      // Verifica o histórico
      const history = await client.query(
        "SELECT * FROM treatment_history WHERE treatment_id = $1 ORDER BY created_at DESC",
        [treatment.rows[0].id]
      );

      console.log("\nHistórico encontrado:");
      console.log(`Total de registros: ${history.rows.length}`);
      history.rows.forEach((record, index) => {
        console.log(`\nRegistro ${index + 1}:`);
        console.log(record);
      });
    } else {
      console.log("\nNenhum tratamento encontrado para este pedido");
    }

    // Verifica o progresso
    const progress = await client.query(
      "SELECT * FROM order_progress WHERE order_id = $1",
      [orderId]
    );

    console.log("\nProgresso do pedido:");
    if (progress.rows.length > 0) {
      console.log(progress.rows[0]);
    } else {
      console.log("Nenhum registro de progresso encontrado");
    }
  } catch (error) {
    console.error("Erro durante a verificação:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verifica um pedido específico
const orderId = process.argv[2];
if (!orderId) {
  console.error("Por favor, forneça o ID do pedido como argumento");
  process.exit(1);
}

debugTreatment(orderId);
