import { NextResponse } from 'next/server';
import { getTreatmentHistory } from '@/lib/services/treatments-service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'OrderId é obrigatório' }, { status: 400 });
    }

    const history = await getTreatmentHistory(orderId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching treatment history:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de tratamento' },
      { status: 500 }
    );
  }
} 