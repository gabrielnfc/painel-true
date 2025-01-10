import { NextResponse } from 'next/server';
import { treatmentService } from '@/lib/services/treatment-service';

export async function POST(req: Request) {
    try {
        const { orderNumber } = await req.json();
        
        if (!orderNumber) {
            return NextResponse.json(
                { error: 'Número do pedido é obrigatório' },
                { status: 400 }
            );
        }

        // Busca detalhes do pedido no BigQuery
        const orderDetails = await treatmentService.getOrderDetails(orderNumber);

        if (!orderDetails) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        // Busca tratamento existente no banco SQL
        const treatment = await treatmentService.getTreatmentByOrderId(orderNumber);

        return NextResponse.json({
            order: orderDetails,
            treatment
        });
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar pedido' },
            { status: 500 }
        );
    }
} 