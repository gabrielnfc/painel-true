import { Pool, PoolClient, QueryResult } from 'pg';

interface Database {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  getClient(): Promise<PoolClient>;
  end(): Promise<void>;
}

declare const db: Database;
export default db; 