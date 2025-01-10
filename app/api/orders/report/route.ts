import { NextRequest } from 'next/server';
import { reportService } from '@/lib/services/report-service';
import { withRateLimit } from '@/lib/rate-limit';

async function handler(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ 
          error: 'As datas inicial e final são obrigatórias' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar formato das datas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return new Response(
        JSON.stringify({ 
          error: 'Formato de data inválido' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar intervalo de datas
    if (end < start) {
      return new Response(
        JSON.stringify({ 
          error: 'A data final deve ser maior que a data inicial' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar intervalo máximo de 3 meses
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (diffMonths > 3) {
      return new Response(
        JSON.stringify({ 
          error: 'O intervalo máximo permitido é de 3 meses' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const results = await reportService.getOrdersReport(startDate, endDate);

    return new Response(
      JSON.stringify({ 
        results,
        metadata: {
          total: results.length,
          startDate,
          endDate,
        }
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
      }
    );
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno ao gerar relatório',
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const GET = withRateLimit(handler); 