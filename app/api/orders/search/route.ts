import { NextResponse } from 'next/server';
import { bigQueryService } from '@/lib/bigquery';
import { z } from 'zod';

const searchParamsSchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório'),
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('10'),
  sortKey: z.enum(['data_pedido_status', 'numero_pedido', 'total_pedido']).optional().default('data_pedido_status'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('Parâmetros recebidos:', Object.fromEntries(searchParams));
    
    // Validate search parameters
    const result = searchParamsSchema.safeParse({
      q: searchParams.get('q'),
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '10',
      sortKey: searchParams.get('sortKey') || 'data_pedido_status',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!result.success) {
      console.error('Erro de validação:', result.error);
      return NextResponse.json(
        { 
          error: 'Parâmetros de busca inválidos',
          details: result.error.issues
        },
        { status: 400 }
      );
    }

    const { q: query, page, pageSize, sortKey, sortOrder } = result.data;
    console.log('Parâmetros validados:', { query, page, pageSize, sortKey, sortOrder });

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    const results = await bigQueryService.searchOrder(query, {
      sortKey,
      sortOrder,
      pageSize: parseInt(pageSize),
      offset,
    });

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      results,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: results.length,
        hasMore: results.length === parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a busca' },
      { status: 500 }
    );
  }
}