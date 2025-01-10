import Redis from 'ioredis';

interface CacheMetrics {
  operation: string;
  key: string;
  duration: number;
  success: boolean;
  timestamp: string;
  error?: string;
  size?: number;
  service?: string;
}

const logCacheMetrics = (metrics: CacheMetrics): void => {
  console.log('Redis metrics:', {
    ...metrics,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
    cacheSize: metrics.size,
    hitRatio: metrics.success ? 1 : 0,
    operationType: metrics.operation,
    latency: metrics.duration,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cacheType: 'redis',
    service: metrics.service || 'default'
  });
};

const redis = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false
  },
  retryStrategy: (times) => {
    if (times > 3) {
      console.error(`Redis retry limit exceeded after ${times} attempts`);
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  disconnectTimeout: 2000,
  keepAlive: 10000,
  noDelay: true
});

redis.on('error', (error) => {
  console.error('Redis connection error:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

redis.on('connect', () => {
  console.log('Redis connected successfully:', {
    timestamp: new Date().toISOString(),
    host: process.env.REDIS_HOST
  });
});

redis.on('ready', () => {
  console.log('Redis ready for operations:', {
    timestamp: new Date().toISOString()
  });
});

redis.on('close', () => {
  console.log('Redis connection closed:', {
    timestamp: new Date().toISOString()
  });
});

// Wrapper para operações do Redis com fallback e métricas
export const cacheWrapper = {
  async get(key: string): Promise<string | null> {
    const startTime = Date.now();
    try {
      const value = await redis.get(key);
      const duration = Date.now() - startTime;

      logCacheMetrics({
        operation: 'get',
        key,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      });

      return value;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logCacheMetrics({
        operation: 'get',
        key,
        duration,
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const startTime = Date.now();
    try {
      if (ttl) {
        await redis.setex(key, ttl, value);
      } else {
        await redis.set(key, value);
      }
      
      const duration = Date.now() - startTime;
      
      logCacheMetrics({
        operation: 'set',
        key,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logCacheMetrics({
        operation: 'set',
        key,
        duration,
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    try {
      await redis.del(key);
      
      const duration = Date.now() - startTime;
      
      logCacheMetrics({
        operation: 'del',
        key,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logCacheMetrics({
        operation: 'del',
        key,
        duration,
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export { redis }; 