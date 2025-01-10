import { NextRequest, NextResponse } from 'next/server';
import { TreatmentService } from '@/lib/services/treatment-service';
import { CreateTreatmentDTO, UpdateTreatmentDTO } from '@/lib/types/treatment';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs';

const treatmentService = new TreatmentService();

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Garante que o tratamento existe
    const treatment = await treatmentService.ensureTreatmentExists(orderId);
    return NextResponse.json(treatment);
  } catch (error) {
    console.error('Error fetching treatment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: CreateTreatmentDTO = await request.json();

    // Validar dados obrigatórios
    if (!data.order_id || !data.new_delivery_deadline || !data.resolution_deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Buscar informações do usuário do Clerk
    const user = await clerkClient.users.getUser(userId);
    const userName = `${user.firstName} ${user.lastName}`.trim();

    // Criar o tratamento
    const treatment = await treatmentService.createTreatment(data);

    // Criar o primeiro registro no histórico
    await treatmentService.createTreatmentHistory(
      treatment.id,
      userId,
      userName,
      {
        observations: data.observations,
        internal_notes: data.internal_notes,
        customer_contact: data.customer_contact,
        carrier_protocol: data.carrier_protocol,
        new_delivery_deadline: data.new_delivery_deadline,
        resolution_deadline: data.resolution_deadline,
        follow_up_date: data.follow_up_date,
        delivery_status: data.delivery_status,
        treatment_status: data.treatment_status,
        priority_level: data.priority_level,
        action_taken: data.action_taken,
        resolution_type: data.resolution_type,
        complaint_reason: data.complaint_reason,
        identified_problem: data.identified_problem
      }
    );

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const treatmentId = request.nextUrl.searchParams.get('id');
    if (!treatmentId) {
      return NextResponse.json({ error: 'Treatment ID is required' }, { status: 400 });
    }

    const data: UpdateTreatmentDTO = await request.json();
    
    // Buscar informações do usuário do Clerk
    const user = await clerkClient.users.getUser(userId);
    const userName = `${user.firstName} ${user.lastName}`.trim();

    // Garante que o tratamento existe antes de atualizar
    const orderId = data.order_id;
    if (orderId) {
      await treatmentService.ensureTreatmentExists(orderId);
    }

    const treatment = await treatmentService.updateTreatment(
      parseInt(treatmentId), 
      data,
      userId,
      userName
    );
    
    return NextResponse.json(treatment);
  } catch (error) {
    console.error('Error updating treatment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 