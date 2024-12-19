import { NextRequest, NextResponse } from 'next/server';
import { bigQueryService } from '@/lib/bigqueryService';
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
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const searchValue = req.nextUrl.searchParams.get('q');
    
    if (!searchValue) {
      return NextResponse.json({ error: 'Search value is required' }, { status: 400 });
    }

    // Validate search value format
    if (!isValidSearchValue(searchValue)) {
      return NextResponse.json({ 
        error: 'Formato inválido. O valor deve ser um dos seguintes formatos:\n' +
              '- ID do Pedido: 9 dígitos\n' +
              '- Número do Pedido: 6 dígitos\n' +
              '- ID da Nota Fiscal: 9 dígitos\n' +
              '- Número da Ordem de Compra: 13 dígitos + hífen + 2 dígitos'
      }, { status: 400 });
    }

    const results = await bigQueryService.searchOrder(searchValue);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching orders:', error);
    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { searchValue } = await req.json();
    
    if (!searchValue) {
      return NextResponse.json({ error: 'Search value is required' }, { status: 400 });
    }

    // Validate search value format
    if (!isValidSearchValue(searchValue)) {
      return NextResponse.json({ 
        error: 'Formato inválido. O valor deve ser um dos seguintes formatos:\n' +
              '- ID do Pedido: 9 dígitos\n' +
              '- Número do Pedido: 6 dígitos\n' +
              '- ID da Nota Fiscal: 9 dígitos\n' +
              '- Número da Ordem de Compra: 13 dígitos + hífen + 2 dígitos'
      }, { status: 400 });
    }

    const results = await bigQueryService.searchOrder(searchValue);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching orders:', error);
    return NextResponse.json(
      { error: 'Failed to search orders' },
      { status: 500 }
    );
  }
}