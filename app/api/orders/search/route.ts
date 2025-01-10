import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/services/search-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // Busca pedidos usando o serviço
    const orders = await searchService.searchOrders(query, pageSize, offset);

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        pageSize,
        total: orders.length,
        totalPages: Math.ceil(orders.length / pageSize)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}