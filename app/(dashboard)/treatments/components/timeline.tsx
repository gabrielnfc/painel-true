import { cn } from '@/lib/utils';
import {
	CheckCircle2,
	Clock,
	Package,
	Truck,
	AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface TimelineProps {
	order: any;
	className?: string;
}

interface TimelineEvent {
	icon: any;
	label: string;
	date: string | null;
	status: 'completed' | 'current' | 'pending';
}

export function Timeline({ order, className }: TimelineProps) {
	const [treatmentProgress, setTreatmentProgress] = useState<string | null>(
		null
	);

	// Busca o progresso do tratamento
	useEffect(() => {
		async function fetchTreatmentProgress() {
			try {
				const response = await fetch(
					`/api/treatments/progress?orderId=${order.id_pedido}`
				);
				if (response.ok) {
					const data = await response.json();
					setTreatmentProgress(data.status);
				}
			} catch (error) {
				console.error('Error fetching treatment progress:', error);
			}
		}

		fetchTreatmentProgress();
	}, [order.id_pedido]);

	const events: TimelineEvent[] = [
		{
			icon: Package,
			label: 'Pedido Realizado',
			date: order.data_pedido,
			status: 'completed',
		},
		{
			icon: Package,
			label: 'Faturado',
			date: order.data_faturamento,
			status: order.data_faturamento ? 'completed' : 'pending',
		},
		{
			icon: Package,
			label: 'Expedido',
			date: order.data_expedicao,
			status: order.data_expedicao ? 'completed' : 'pending',
		},
		{
			icon: Truck,
			label: 'Coletado',
			date: order.data_coleta,
			status: order.data_coleta ? 'completed' : 'pending',
		},
	];

	// Adiciona o evento de tratamento se houver progresso
	if (treatmentProgress) {
		events.push({
			icon: AlertTriangle,
			label: treatmentProgress,
			date: null,
			status: 'current',
		});
	}

	// Adiciona o evento de entrega por último
	events.push({
		icon: CheckCircle2,
		label: 'Entregue',
		date: order.data_entrega,
		status: order.data_entrega ? 'completed' : 'pending',
	});

	// Encontra o último evento completado
	const lastCompletedIndex = events.reduce((acc, event, index) => {
		return event.status === 'completed' ? index : acc;
	}, -1);

	// Define o próximo evento como 'current' se não houver tratamento
	if (!treatmentProgress && lastCompletedIndex < events.length - 1) {
		events[lastCompletedIndex + 1].status = 'current';
	}

	return (
		<div className={cn('space-y-4', className)}>
			<h3 className="text-sm font-medium">Linha do Tempo</h3>
			<div className="relative">
				{/* Linha de conexão */}
				<div className="absolute left-6 top-0 h-full w-px bg-border" />

				{/* Eventos */}
				<div className="space-y-6">
					{events.map((event, index) => {
						const Icon = event.icon;
						return (
							<div key={index} className="flex gap-4">
								<div className="relative">
									<div
										className={cn(
											'flex h-12 w-12 items-center justify-center rounded-full border-2',
											event.status === 'completed' &&
												'border-green-500 bg-green-50 text-green-500',
											event.status === 'current' &&
												'border-blue-500 bg-blue-50 text-blue-500',
											event.status === 'pending' &&
												'border-gray-200 bg-gray-50 text-gray-400'
										)}
									>
										<Icon className="h-5 w-5" />
									</div>
								</div>
								<div className="flex flex-col justify-center">
									<p
										className={cn(
											'text-sm font-medium',
											event.status === 'completed' && 'text-green-600',
											event.status === 'current' && 'text-blue-600',
											event.status === 'pending' && 'text-gray-500'
										)}
									>
										{event.label}
									</p>
									<p className="text-sm text-muted-foreground">
										{event.date || 'Pendente'}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
