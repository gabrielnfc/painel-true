import { NextResponse } from 'next/server';
import { alertsService } from '@/lib/services/alerts-service';

export async function GET() {
  try {
    const carriers = await alertsService.getAvailableCarriers();
    return NextResponse.json(carriers);
  } catch (error) {
    console.error('Erro ao buscar transportadoras:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar transportadoras' },
      { status: 500 }
    );
  }
} 