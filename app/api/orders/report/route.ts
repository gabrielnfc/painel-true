import { NextRequest } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';
import { withRateLimit } from '@/lib/rate-limit';

// Função principal do handler
async function handler(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('Recebendo requisição de relatório:', { startDate, endDate });

    if (!startDate || !endDate) {
      console.error('Parâmetros de data faltando');
      return new Response(JSON.stringify({ error: 'Missing date parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bigquery = new BigQueryService();
    const results = await bigquery.getOrdersReport(startDate, endDate);

    console.log('Resultados obtidos:', { count: results.length });

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Exporta o handler com rate limiting
export const GET = withRateLimit(handler); 