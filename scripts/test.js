const Redis = require("ioredis");

const redis = new Redis({
  port: 6379,
  host: "ready-guinea-24927.upstash.io",
  username: "default",
  password: "AWFfAAIjcDFkOWNhYmVlNWQ4Nzk0Nzk4OGYxYjIzZmY1NzZjZGRhNXAxMA",
  tls: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    console.log("Testando conexão...");
    await redis.set("test", "hello");
    const value = await redis.get("test");
    console.log("Valor recuperado:", value);
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

test();
