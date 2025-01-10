import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await query(
      'SELECT status FROM order_progress WHERE order_id = $1',
      [orderId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({ status: result.rows[0].status });
  } catch (error) {
    console.error('Error fetching treatment progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 