import { NextRequest, NextResponse } from 'next/server';
import { alertsService } from '@/lib/services/alerts-service';
import { treatmentService } from '@/lib/services/treatment-service';
import { cacheWrapper } from '@/lib/redis';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const carrier = searchParams.get('carrier') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Tentar obter do Redis
    const cacheKey = `alerts-${search}-${carrier}-${status}-${priority}-${dateFrom}-${dateTo}-${page}-${pageSize}`;
    const cachedData = await cacheWrapper.get(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }
    
    // Busca pedidos atrasados com todos os filtros
    const delayedOrders = await alertsService.getDelayedOrders(search, carrier, {
      status,
      priority,
      dateFrom,
      dateTo
    });

    // Calcula índices para paginação
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = delayedOrders.slice(startIndex, endIndex);

    // Busca tratamentos existentes para os pedidos
    const orderIds = paginatedOrders.map(order => order.id_pedido);
    const treatments = await treatmentService.getTreatmentsByOrderIds(orderIds);

    // Combina os dados dos pedidos com seus tratamentos
    const ordersWithTreatments = paginatedOrders.map(order => {
      const treatment = treatments.find(t => t.order_id === order.id_pedido);
      return {
        ...order,
        status: treatment ? treatment.status : 'pending'
      }
    });

    const response = {
      data: ordersWithTreatments,
      pagination: {
        total: delayedOrders.length,
        page,
        pageSize,
        totalPages: Math.ceil(delayedOrders.length / pageSize)
      }
    };

    // Salvar no Redis
    await cacheWrapper.set(cacheKey, JSON.stringify(response), 60);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
} 