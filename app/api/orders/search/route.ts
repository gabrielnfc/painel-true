import { NextRequest, NextResponse } from 'next/server';
import { bigQueryService } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortKey = searchParams.get('sortKey') || 'data_pedido_status';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    if (!query) {
      return NextResponse.json(
        { error: 'Parâmetro de busca é obrigatório' },
        { status: 400 }
      );
    }

    const results = await bigQueryService.searchOrder(query, {
      pageSize,
      offset: (page - 1) * pageSize,
      sortKey,
      sortOrder,
    });

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar busca' },
      { status: 500 }
    );
  }
}