import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/services/alerts-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const type = url.searchParams.get('type') || undefined;
    const status = url.searchParams.get('status') || undefined;

    const alerts = await getAlerts({ page, limit, type, status });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
} 