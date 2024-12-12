import { NextResponse } from 'next/server';
import { bigQueryService } from '@/lib/bigquery';
import { z } from 'zod';

const reportParamsSchema = z.object({
  startDate: z.string().min(1, 'Data inicial é obrigatória'),
  endDate: z.string().min(1, 'Data final é obrigatória'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('Parâmetros recebidos:', Object.fromEntries(searchParams));
    
    // Validate search parameters
    const result = reportParamsSchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });

    if (!result.success) {
      console.error('Erro de validação:', result.error);
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: result.error.issues
        },
        { status: 400 }
      );
    }

    const { startDate, endDate } = result.data;
    console.log('Parâmetros validados:', { startDate, endDate });

    const results = await bigQueryService.getOrdersReport(startDate, endDate);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum pedido encontrado no período' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      results,
      total: results.length
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao processar relatório' },
      { status: 500 }
    );
  }
} 