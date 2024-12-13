import { NextRequest, NextResponse } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Parâmetro de busca é obrigatório' },
        { status: 400 }
      );
    }

    const bigQueryService = new BigQueryService({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL || '',
        private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
    });

    const results = await bigQueryService.searchOrder(query);

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { error: 'Erro ao processar busca' },
      { status: 500 }
    );
  }
}