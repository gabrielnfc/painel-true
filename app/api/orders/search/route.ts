import { NextResponse } from 'next/server';
import { searchService } from '../../../lib/services/search-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const results = await searchService.searchOrders(query, limit, offset);
    return NextResponse.json({
      data: results,
      pagination: {
        page,
        pageSize: limit,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}