import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitInfo {
  requests: number;
  resetTime: number;
}

// Armazena os limites por IP
const rateLimits = new Map<string, RateLimitInfo>();

// Limpa o cache periodicamente
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimits.keys()).forEach(ip => {
    const info = rateLimits.get(ip);
    if (info && now > info.resetTime) {
      rateLimits.delete(ip);
    }
  });
}, 60000); // Limpa a cada minuto

export function getRateLimitConfig(): RateLimitConfig {
  return {
    maxRequests: Number(process.env.RATE_LIMIT_MAX) || 20,
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  };
}

export async function rateLimiter(request: NextRequest) {
  // Não aplica rate limiting em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const config = getRateLimitConfig();
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || request.ip || 'unknown';
  const now = Date.now();

  // Obtém ou cria informações de limite para o IP
  let limitInfo = rateLimits.get(ip);
  if (!limitInfo || now > limitInfo.resetTime) {
    limitInfo = {
      requests: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Incrementa o contador de requisições
  limitInfo.requests++;
  rateLimits.set(ip, limitInfo);

  // Prepara os headers de resposta
  const responseHeaders = new Headers({
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.maxRequests - limitInfo.requests).toString(),
    'X-RateLimit-Reset': Math.ceil((limitInfo.resetTime - now) / 1000).toString(),
  });

  // Verifica se excedeu o limite
  if (limitInfo.requests > config.maxRequests) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: responseHeaders,
    });
  }

  return null;
}

type RouteHandler = (request: NextRequest) => Promise<Response> | Response;

// Middleware para aplicar rate limiting em rotas específicas
export function withRateLimit(handler: RouteHandler): RouteHandler {
  return async function rateLimit(request: NextRequest) {
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
} 