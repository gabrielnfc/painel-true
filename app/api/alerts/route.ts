import { NextRequest, NextResponse } from 'next/server';
import { alertsService } from '@/lib/services/alerts-service';
import { treatmentService } from '@/lib/services/treatment-service';
import { redis } from '@/lib/redis';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const carrier = searchParams.get('carrier') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const delayedOrders = await alertsService.getDelayedOrders(search, carrier, {
      status,
      priority,
      dateFrom,
      dateTo
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = delayedOrders.slice(startIndex, endIndex);

    const response = {
      data: paginatedOrders,
      pagination: {
        total: delayedOrders.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(delayedOrders.length / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
} 