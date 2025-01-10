'use client';

import { cn } from '@/lib/utils';
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	MessageCircle,
	Phone,
	Truck,
	Package,
	Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TreatmentTimelineProps {
	treatmentId: number;
	className?: string;
}

interface TreatmentHistoryEntry {
	id: number;
	treatment_id: number;
	user_id: string;
	user_name: string;
	observations: string;
	internal_notes: string | null;
	customer_contact: string | null;
	carrier_protocol: string | null;
	new_delivery_deadline: string;
	resolution_deadline: string;
	follow_up_date: string | null;
	delivery_status: string;
	treatment_status: string;
	priority_level: number;
	action_taken: string | null;
	resolution_type: string | null;
	created_at: string;
}

export function TreatmentTimeline({
	treatmentId,
	className,
}: TreatmentTimelineProps) {
	const [history, setHistory] = useState<TreatmentHistoryEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchTreatmentHistory() {
			try {
				const response = await fetch(
					`/api/treatments/history?id=${treatmentId}`
				);
				if (response.ok) {
					const data = await response.json();
					setHistory(data);
				}
			} catch (error) {
				console.error('Error fetching treatment history:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchTreatmentHistory();
	}, [treatmentId]);

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'pending':
				return Clock;
			case 'ongoing':
				return AlertTriangle;
			case 'waiting_customer':
				return Phone;
			case 'waiting_carrier':
				return Truck;
			case 'waiting_stock':
				return Package;
			case 'rerouting':
				return Truck;
			case 'scheduling_delivery':
				return Calendar;
			case 'resolved':
				return CheckCircle2;
			case 'cancelled':
				return AlertTriangle;
			default:
				return MessageCircle;
		}
	};

	const formatDate = (dateStr: string) => {
		try {
			return format(parseISO(dateStr), "dd 'de' MMMM 'às' HH:mm", {
				locale: ptBR,
			});
		} catch {
			return dateStr;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'resolved':
				return 'border-green-500 bg-green-50 text-green-500';
			case 'cancelled':
				return 'border-red-500 bg-red-50 text-red-500';
			case 'ongoing':
				return 'border-yellow-500 bg-yellow-50 text-yellow-500';
			default:
				return 'border-blue-500 bg-blue-50 text-blue-500';
		}
	};

	const getStatusText = (status: string) => {
		const statusMap: { [key: string]: string } = {
			pending: 'Aguardando análise',
			ongoing: 'Em tratamento',
			waiting_customer: 'Aguardando cliente',
			waiting_carrier: 'Aguardando transportadora',
			waiting_stock: 'Aguardando estoque',
			rerouting: 'Redirecionando entrega',
			scheduling_delivery: 'Agendando entrega',
			resolved: 'Tratamento concluído',
			cancelled: 'Tratamento cancelado',
		};

		return statusMap[status] || status;
	};

	if (loading) {
		return <div>Carregando histórico...</div>;
	}

	if (history.length === 0) {
		return <div>Nenhum histórico encontrado.</div>;
	}

	return (
		<div className={cn('space-y-4', className)}>
			<div className="relative">
				{/* Linha de conexão */}
				<div className="absolute left-6 top-0 h-full w-px bg-border" />

				{/* Eventos */}
				<div className="space-y-6">
					{history.map((entry, index) => {
						const Icon = getStatusIcon(entry.treatment_status);
						const statusColor = getStatusColor(entry.treatment_status);

						return (
							<div key={entry.id} className="flex gap-4">
								<div className="relative">
									<div
										className={cn(
											'flex h-12 w-12 items-center justify-center rounded-full border-2',
											statusColor
										)}
									>
										<Icon className="h-5 w-5" />
									</div>
								</div>
								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between">
										<p className="text-sm font-medium">
											{getStatusText(entry.treatment_status)}
										</p>
										<time className="text-sm text-muted-foreground">
											{formatDate(entry.created_at)}
										</time>
									</div>

									<div className="rounded-lg border bg-card p-4 space-y-3">
										<div className="space-y-1">
											<p className="text-sm font-medium">Observações</p>
											<p className="text-sm text-muted-foreground">
												{entry.observations}
											</p>
										</div>

										{entry.internal_notes && (
											<div className="space-y-1">
												<p className="text-sm font-medium">Notas Internas</p>
												<p className="text-sm text-muted-foreground">
													{entry.internal_notes}
												</p>
											</div>
										)}

										{entry.customer_contact && (
											<div className="space-y-1">
												<p className="text-sm font-medium">
													Contato com Cliente
												</p>
												<p className="text-sm text-muted-foreground">
													{entry.customer_contact}
												</p>
											</div>
										)}

										{entry.carrier_protocol && (
											<div className="space-y-1">
												<p className="text-sm font-medium">
													Protocolo Transportadora
												</p>
												<p className="text-sm text-muted-foreground">
													{entry.carrier_protocol}
												</p>
											</div>
										)}

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
											<div>
												<p className="text-sm font-medium">
													Nova Data de Entrega
												</p>
												<p className="text-sm text-muted-foreground">
													{format(
														parseISO(entry.new_delivery_deadline),
														'dd/MM/yyyy'
													)}
												</p>
											</div>
											<div>
												<p className="text-sm font-medium">Data de Resolução</p>
												<p className="text-sm text-muted-foreground">
													{format(
														parseISO(entry.resolution_deadline),
														'dd/MM/yyyy'
													)}
												</p>
											</div>
										</div>

										<div className="text-sm text-muted-foreground pt-2">
											<span className="font-medium">Atualizado por:</span>{' '}
											{entry.user_name}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
