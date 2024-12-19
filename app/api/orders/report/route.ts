import { NextRequest, NextResponse } from 'next/server';

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

    // Verificar se as credenciais do BigQuery estão disponíveis
    if (!process.env.GOOGLE_CREDENTIALS) {
      console.error('Credenciais do BigQuery não encontradas');
      return NextResponse.json(
        { error: 'BigQuery credentials not configured' },
        { status: 500 }
      );
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
        console.error('Credenciais do BigQuery inválidas ou incompletas');
        return NextResponse.json(
          { error: 'Invalid BigQuery credentials format' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Erro ao parsear credenciais do BigQuery:', error);
      return NextResponse.json(
        { error: 'Invalid BigQuery credentials JSON' },
        { status: 500 }
      );
    }

    // Importação dinâmica do BigQueryService
    const { BigQueryService } = await import('@/lib/bigquery');
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