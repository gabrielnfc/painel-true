import { NextResponse } from 'next/server';
import { TreatmentService } from 'lib/services/treatment-service';

const treatmentService = new TreatmentService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({ error: 'OrderId é obrigatório' }, { status: 400 });
    }

    const treatment = await treatmentService.getTreatmentByOrderId(orderId);
    if (!treatment) {
      return NextResponse.json({ error: 'Tratativa não encontrada' }, { status: 404 });
    }

    const history = await treatmentService.getTreatmentHistory(treatment.id);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico de tratativas:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico de tratativas' }, { status: 500 });
  }
} 