import { BigQueryService } from '@/lib/bigquery';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { orderNumber } = await req.json();
        
        if (!orderNumber) {
            return NextResponse.json(
                { error: 'Número do pedido é obrigatório' },
                { status: 400 }
            );
        }

        const bigQueryService = new BigQueryService();
        const results = await bigQueryService.searchOrder(orderNumber);

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar pedido' },
            { status: 500 }
        );
    }
} 