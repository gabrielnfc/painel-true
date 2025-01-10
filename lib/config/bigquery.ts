import { BigQuery } from '@google-cloud/bigquery';

// Configuração centralizada do BigQuery
export const bigQueryConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  // Configurações de performance e monitoramento
  maximumBytesBilled: process.env.BIGQUERY_MAX_BYTES_BILLED ? 
    parseInt(process.env.BIGQUERY_MAX_BYTES_BILLED) : 1000000000, // 1GB default
  location: 'US',
  jobTimeoutMs: 30000, // 30 segundos
  retryOptions: {
    retryDelayMultiplier: 2,
    totalTimeout: 60000, // 1 minuto
    maxRetries: 3
  },
  query: {
    useQueryCache: true,
    useLegacySql: false
  }
};

// Instância singleton do BigQuery
export const bigquery = new BigQuery(bigQueryConfig);

// Monitoramento de queries
export const monitorQuery = async (query: string, options: any = {}) => {
  const startTime = Date.now();
  try {
    const [job] = await bigquery.createQueryJob({
      query,
      ...options,
      ...bigQueryConfig.query
    });

    const [rows] = await job.getQueryResults();
    
    const metadata = await job.getMetadata();
    const statistics = metadata[0].statistics;
    
    console.log('BigQuery Query Stats:', {
      queryId: job.id,
      duration: Date.now() - startTime,
      bytesProcessed: statistics.totalBytesProcessed,
      rowsReturned: rows.length,
      cacheHit: statistics.query.cacheHit,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    return rows;
  } catch (error) {
    console.error('BigQuery Query Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    throw error;
  }
}; 