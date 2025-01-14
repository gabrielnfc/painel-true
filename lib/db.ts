import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

interface PoolMetrics {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

class Database {
  private pool: Pool | null = null;
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  };

  constructor() {
    this.initializePool();
  }

  private initializePool(): void {
    if (this.pool) return;

    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      allowExitOnIdle: true,
      application_name: 'painel-true',
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    this.pool.on('error', (err: Error) => {
      console.error('Erro inesperado no pool de conexões:', err);
      this.logError('pool_error', err);
      this.logPoolMetrics();
      setTimeout(() => {
        console.log('Tentando reinicializar o pool de conexões...');
        this.initializePool();
      }, 5000);
    });

    this.pool.on('connect', (client: PoolClient) => {
      this.logInfo('new_connection', 'Nova conexão estabelecida com o banco de dados');
      this.logPoolMetrics();
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Operation failed after all retries');
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logError('query_retry', error as Error, { attempt });

        if (attempt === this.retryConfig.maxRetries) break;

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, this.retryConfig.maxDelay);
      }
    }

    throw lastError;
  }

  private logError(type: string, error: Error, metadata: Record<string, any> = {}): void {
    console.error({
      type,
      error: {
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...metadata,
    });
  }

  private logInfo(type: string, message: string, metadata: Record<string, any> = {}): void {
    console.log({
      type,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...metadata,
    });
  }

  private async logPoolMetrics(): Promise<void> {
    const metrics = await this.getPoolMetrics();
    this.logInfo('pool_metrics', 'Métricas do pool de conexões', {
      ...metrics,
      memory: process.memoryUsage()
    });
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      this.initializePool();
    }

    return this.withRetry(async () => {
      try {
        const start = Date.now();
        await this.logPoolMetrics();
        const result = await this.pool!.query<T>(text, params);
        const duration = Date.now() - start;

        this.logInfo('query_executed', 'Query executada com sucesso', {
          duration,
          rowCount: result.rowCount,
          queryFirstChars: text.substring(0, 50)
        });

        return result;
      } catch (error) {
        this.logError('query_error', error as Error, {
          query: text,
          params,
          queryFirstChars: text.substring(0, 50)
        });
        throw error;
      }
    });
  }

  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      this.initializePool();
    }

    try {
      const client = await this.withRetry(async () => {
        return await this.pool!.connect();
      });

      const release = client.release;
      client.release = () => {
        client.release = release;
        return release.call(client);
      };

      return client;
    } catch (error) {
      this.logError('client_acquisition_error', error as Error);
      throw error;
    }
  }

  private async getPoolMetrics(): Promise<PoolMetrics> {
    if (!this.pool) return { totalCount: 0, idleCount: 0, waitingCount: 0 };

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async end(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

const db = new Database();
export default db; 