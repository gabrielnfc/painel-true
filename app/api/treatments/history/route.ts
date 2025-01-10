import { NextRequest, NextResponse } from 'next/server';
import { treatmentService } from '@/lib/services/treatment-service';
import { auth } from '@clerk/nextjs';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const treatmentId = request.nextUrl.searchParams.get('id');
    if (!treatmentId) {
      return NextResponse.json({ error: 'Treatment ID is required' }, { status: 400 });
    }

    const history = await treatmentService.getTreatmentHistory(parseInt(treatmentId));
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching treatment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 