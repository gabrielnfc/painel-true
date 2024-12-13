import { NextRequest, NextResponse } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const bigQueryService = new BigQueryService({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL || '',
        private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
    });

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