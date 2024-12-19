import { NextRequest, NextResponse } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Se estamos no processo de build, retorne um array vazio
  if (process.env.VERCEL_ENV === 'build') {
    console.log('Pulando busca no BigQuery durante o build');
    return NextResponse.json({ results: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Data inicial e final são obrigatórias' },
        { status: 400 }
      );
    }

    const bigQueryService = new BigQueryService();

    const results = await bigQueryService.getOrdersReport(startDate, endDate);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum pedido encontrado no período' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
} 