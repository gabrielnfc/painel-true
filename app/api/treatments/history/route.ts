import { NextResponse } from 'next/server';
import { TreatmentService } from 'lib/services/treatment-service';

const treatmentService = new TreatmentService();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do tratamento é obrigatório' }, { status: 400 });
    }

    const history = await treatmentService.getTreatmentHistory(Number(id));
    return NextResponse.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico de tratativas:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico de tratativas' }, { status: 500 });
  }
} 