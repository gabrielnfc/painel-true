import { NextRequest } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';
import { withRateLimit } from '@/lib/rate-limit';

// Função principal do handler
async function handler(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: 'Missing date parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bigquery = new BigQueryService();
    const orders = await bigquery.getOrdersReport(startDate, endDate);

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Exporta o handler com rate limiting
export const GET = withRateLimit(handler); 