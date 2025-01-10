import { chatService } from '@/lib/services/chat-service';
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

        const result = await chatService.searchOrder(orderNumber);

        if (!result) {
            return NextResponse.json(
                { error: 'Pedido não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar pedido' },
            { status: 500 }
        );
    }
} 