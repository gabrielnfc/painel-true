import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OrderDetails } from '../components/order-details';
import { TreatmentForm } from '../components/treatment-form';
import { treatmentService } from '@/lib/services/treatment-service';
import { TreatmentHistory } from '../components/treatment-history';

export const metadata: Metadata = {
	title: 'Tratamento de Pedido | Painel True',
	description: 'Gerenciamento de tratamento de pedido atrasado',
};

interface TreatmentPageProps {
	params: {
		orderId: string;
	};
}

async function getOrderData(orderId: string) {
	try {
		// Buscar detalhes do pedido
		const orderDetails = await treatmentService.getOrderDetails(orderId);
		if (!orderDetails) {
			return null;
		}

		// Garantir que existe um tratamento para o pedido
		const treatment = await treatmentService.ensureTreatmentExists(orderId);

		return {
			order: orderDetails,
			treatment,
		};
	} catch (error) {
		console.error('Error fetching order data:', error);
		return null;
	}
}

export default async function TreatmentPage({ params }: TreatmentPageProps) {
	const data = await getOrderData(params.orderId);

	if (!data) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">
					Tratamento do Pedido {data.order.numero_pedido}
				</h1>
				<p className="text-muted-foreground">
					Gerencie o tratamento para este pedido atrasado.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6">
					<OrderDetails order={data.order} />
					<div className="p-6 bg-muted rounded-lg">
						<div className="space-y-2">
							<h3 className="font-semibold">Informações Adicionais</h3>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-muted-foreground">Dias em Atraso</p>
									<p className="font-medium">
										{data.order.dias_atraso || 0} dias
									</p>
								</div>
								<div>
									<p className="text-muted-foreground">Nível de Prioridade</p>
									<p className="font-medium">{data.treatment.priority_level}</p>
								</div>
							</div>
						</div>
					</div>
					<TreatmentHistory treatmentId={data.treatment.id} />
				</div>
				<TreatmentForm orderId={params.orderId} initialData={data.treatment} />
			</div>
		</div>
	);
}
