import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await db.query(`
      SELECT 
        treatment_status,
        COUNT(*) as count
      FROM treatment_history th
      JOIN (
        SELECT treatment_id, MAX(created_at) as max_created_at
        FROM treatment_history
        GROUP BY treatment_id
      ) latest ON th.treatment_id = latest.treatment_id 
        AND th.created_at = latest.max_created_at
      GROUP BY treatment_status
      ORDER BY treatment_status;
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching treatment progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment progress' },
      { status: 500 }
    );
  }
} 