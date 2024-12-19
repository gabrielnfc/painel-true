import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export const runtime = 'nodejs';

// Função para validar o formato do valor de busca
function isValidSearchValue(value: string): boolean {
  // ID do Pedido ou ID da Nota Fiscal (9 dígitos)
  const isIdFormat = /^\d{9}$/.test(value);
  
  // Número do Pedido (6 dígitos)
  const isOrderNumberFormat = /^\d{6}$/.test(value);
  
  // Número da Ordem de Compra (13 dígitos + hífen + 2 dígitos)
  const isPurchaseOrderFormat = /^\d{13}-\d{2}$/.test(value);

  return isIdFormat || isOrderNumberFormat || isPurchaseOrderFormat;
}

export async function GET(req: NextRequest) {
  console.log('Recebida requisição GET para busca de pedidos');
  
  try {
    const { userId } = auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('Usuário não autenticado');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const searchValue = req.nextUrl.searchParams.get('q');
    console.log('Valor de busca:', searchValue);
    
    if (!searchValue) {
      console.log('Valor de busca não fornecido');
      return NextResponse.json({ error: 'Search value is required' }, { status: 400 });
    }

    // Validate search value format
    if (!isValidSearchValue(searchValue)) {
      console.log('Formato de busca inválido:', searchValue);
      return NextResponse.json({ 
        error: 'Formato inválido. O valor deve ser um dos seguintes formatos:\n' +
              '- ID do Pedido: 9 dígitos\n' +
              '- Número do Pedido: 6 dígitos\n' +
              '- ID da Nota Fiscal: 9 dígitos\n' +
              '- Número da Ordem de Compra: 13 dígitos + hífen + 2 dígitos'
      }, { status: 400 });
    }

    // Verificar se as credenciais do BigQuery estão disponíveis
    if (!process.env.GOOGLE_CREDENTIALS) {
      console.error('Credenciais do BigQuery não encontradas');
      return NextResponse.json(
        { error: 'BigQuery credentials not configured' },
        { status: 500 }
      );
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
        console.error('Credenciais do BigQuery inválidas ou incompletas');
        return NextResponse.json(
          { error: 'Invalid BigQuery credentials format' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Erro ao parsear credenciais do BigQuery:', error);
      return NextResponse.json(
        { error: 'Invalid BigQuery credentials JSON' },
        { status: 500 }
      );
    }

    console.log('Iniciando busca no BigQuery');
    // Importação dinâmica do BigQueryService
    const { BigQueryService } = await import('@/lib/bigquery');
    const bigQueryService = new BigQueryService();
    
    console.log('Executando busca com valor:', searchValue);
    const results = await bigQueryService.searchOrder(searchValue);
    console.log('Resultados encontrados:', results?.length || 0);

    if (results && results.length > 0) {
      console.log('Primeiro resultado:', {
        id_pedido: results[0].id_pedido,
        numero_pedido: results[0].numero_pedido,
        situacao_pedido: results[0].situacao_pedido
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro detalhado na busca de pedidos:', error);
    
    // Verificar se é um erro de credenciais
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { error: 'BigQuery authentication failed. Please check credentials.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('Recebida requisição POST para busca de pedidos');
  
  try {
    const { userId } = auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('Usuário não autenticado');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchValue } = await req.json();
    console.log('Valor de busca:', searchValue);
    
    if (!searchValue) {
      console.log('Valor de busca não fornecido');
      return NextResponse.json({ error: 'Search value is required' }, { status: 400 });
    }

    // Validate search value format
    if (!isValidSearchValue(searchValue)) {
      console.log('Formato de busca inválido:', searchValue);
      return NextResponse.json({ 
        error: 'Formato inválido. O valor deve ser um dos seguintes formatos:\n' +
              '- ID do Pedido: 9 dígitos\n' +
              '- Número do Pedido: 6 dígitos\n' +
              '- ID da Nota Fiscal: 9 dígitos\n' +
              '- Número da Ordem de Compra: 13 dígitos + hífen + 2 dígitos'
      }, { status: 400 });
    }

    // Verificar se as credenciais do BigQuery estão disponíveis
    if (!process.env.GOOGLE_CREDENTIALS) {
      console.error('Credenciais do BigQuery não encontradas');
      return NextResponse.json(
        { error: 'BigQuery credentials not configured' },
        { status: 500 }
      );
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
        console.error('Credenciais do BigQuery inválidas ou incompletas');
        return NextResponse.json(
          { error: 'Invalid BigQuery credentials format' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Erro ao parsear credenciais do BigQuery:', error);
      return NextResponse.json(
        { error: 'Invalid BigQuery credentials JSON' },
        { status: 500 }
      );
    }

    console.log('Iniciando busca no BigQuery');
    // Importação dinâmica do BigQueryService
    const { BigQueryService } = await import('@/lib/bigquery');
    const bigQueryService = new BigQueryService();
    
    console.log('Executando busca com valor:', searchValue);
    const results = await bigQueryService.searchOrder(searchValue);
    console.log('Resultados encontrados:', results?.length || 0);

    if (results && results.length > 0) {
      console.log('Primeiro resultado:', {
        id_pedido: results[0].id_pedido,
        numero_pedido: results[0].numero_pedido,
        situacao_pedido: results[0].situacao_pedido
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Erro detalhado na busca de pedidos:', error);
    
    // Verificar se é um erro de credenciais
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { error: 'BigQuery authentication failed' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}