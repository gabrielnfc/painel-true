'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, getRelativeDelay } from '@/lib/utils/date-utils';
import { formatCurrency, formatCustomerData } from '@/lib/utils/format-utils';
import {
	getPriorityColor,
	getPriorityLabel,
	getPriorityNumber,
	getPriorityBadgeColor,
} from '@/lib/utils/priority-utils';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
	AlertCircle,
	Calendar,
	Eye,
	Truck,
	Clock,
	Package,
	User,
	DollarSign,
	ExternalLink,
	Info,
} from 'lucide-react';
import type { AlertsResponse, AlertOrder } from '@/types';
import { PriorityIndicator } from '@/components/priority-indicator';
import { getStatusColor } from '@/lib/utils/status-utils';

interface ClienteJson {
	nome: string;
	cpf_cnpj?: string;
	cpf?: string;
	cnpj?: string;
	email?: string;
}

function AlertsContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState(true);
	const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const currentPage = Number(searchParams.get('page')) || 1;
	const status = searchParams.get('status') || '';
	const search = searchParams.get('search') || '';
	const carrier = searchParams.get('carrier') || '';
	const priority = searchParams.get('priority') || '';
	const dateFrom = searchParams.get('dateFrom') || '';
	const dateTo = searchParams.get('dateTo') || '';

	useEffect(() => {
		const fetchAlerts = async () => {
			try {
				setLoading(true);
				const params = new URLSearchParams({
					page: currentPage.toString(),
					pageSize: '10',
					...(status && { status }),
					...(search && { search }),
					...(carrier && { carrier }),
					...(priority && { priority }),
					...(dateFrom && { dateFrom }),
					...(dateTo && { dateTo }),
				});

				const response = await fetch(`/api/alerts?${params}`);
				if (!response.ok) throw new Error('Falha ao carregar alertas');

				const data = await response.json();
				setAlerts(data);
				setError(null);
			} catch (err) {
				console.error('Erro ao carregar alertas:', err);
				setError(
					err instanceof Error ? err.message : 'Erro ao carregar alertas'
				);
				setAlerts(null);
			} finally {
				setLoading(false);
			}
		};

		fetchAlerts();
	}, [currentPage, status, search, carrier, priority, dateFrom, dateTo]);

	const handlePageChange = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', page.toString());
		router.push(`?${params.toString()}`);
	};

	const handleOrderClick = (orderId: string) => {
		router.push(`/ecommerce/treatments/${orderId}`);
	};

	if (loading) {
		return (
			<div className="bg-card rounded-lg shadow p-4 space-y-4">
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, index) => (
						<div key={index} className="flex gap-4 items-center">
							<Skeleton className="h-12 w-full" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-destructive/10 text-destructive rounded-lg p-4 flex items-center gap-2">
				<AlertCircle className="h-5 w-5" />
				<span>Erro: {error}</span>
			</div>
		);
	}

	if (!alerts?.data.length) {
		return (
			<div className="bg-muted rounded-lg p-8 text-center space-y-2">
				<Package className="h-10 w-10 text-muted-foreground mx-auto" />
				<p className="text-muted-foreground">
					Nenhum pedido atrasado encontrado.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-card rounded-lg shadow">
			<div className="overflow-x-auto">
				<div className="min-w-full inline-block align-middle">
					<div className="overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent border-b border-border bg-muted/50">
									<TableHead className="w-[120px]">
										<div className="flex items-center gap-2">
											<Package className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Pedido
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[200px]">
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Cliente
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[110px]">
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Data Pedido
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[110px]">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Prev. Entrega
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[100px]">
										<div className="flex items-center gap-2">
											<AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Prioridade
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[80px]">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Atraso
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[140px]">
										<div className="flex items-center gap-2">
											<Truck className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Transportadora
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[90px]">
										<div className="flex items-center gap-2">
											<Info className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Status
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[90px]">
										<div className="flex items-center gap-2">
											<DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
											<span className="font-semibold text-sm tracking-tight">
												Valor
											</span>
										</div>
									</TableHead>
									<TableHead className="w-[100px] text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{alerts.data.map((alert) => (
									<TableRow
										key={alert.id_pedido}
										className="hover:bg-muted/50 cursor-pointer"
										onClick={() => handleOrderClick(alert.numero_pedido)}
									>
										<TableCell className="font-medium">
											<div className="flex items-center gap-2">
												<div
													className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
														alert.priority === 'critical'
															? 'bg-red-500'
															: alert.priority === 'high'
															? 'bg-orange-500'
															: alert.priority === 'medium'
															? 'bg-yellow-500'
															: 'bg-green-500'
													}`}
												/>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<span>{alert.numero_pedido}</span>
														</TooltipTrigger>
														<TooltipContent>
															<div className="space-y-1">
																<p className="text-sm">
																	Pedido: {alert.numero_pedido}
																</p>
																{alert.numero_nota && (
																	<p className="text-sm">
																		NF: {alert.numero_nota}
																	</p>
																)}
																{alert.numero_ordem_compra && (
																	<p className="text-sm">
																		OC: {alert.numero_ordem_compra}
																	</p>
																)}
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
										</TableCell>
										<TableCell>
											<div className="truncate">
												<span className="font-medium">
													{alert.cliente?.nome ||
														(alert.cliente_json &&
														typeof alert.cliente_json === 'string'
															? (JSON.parse(alert.cliente_json) as ClienteJson)
																	.nome
															: (alert.cliente_json as ClienteJson | undefined)
																	?.nome) ||
														'Nome não disponível'}
												</span>
												<div className="text-sm text-muted-foreground">
													{alert.cliente?.cpf_cnpj ||
														alert.cliente?.cpf ||
														alert.cliente?.cnpj ||
														(alert.cliente_json &&
														typeof alert.cliente_json === 'string'
															? (JSON.parse(alert.cliente_json) as ClienteJson)
																	.cpf_cnpj ||
															  (JSON.parse(alert.cliente_json) as ClienteJson)
																	.cpf ||
															  (JSON.parse(alert.cliente_json) as ClienteJson)
																	.cnpj
															: (alert.cliente_json as ClienteJson | undefined)
																	?.cpf_cnpj ||
															  (alert.cliente_json as ClienteJson | undefined)
																	?.cpf ||
															  (alert.cliente_json as ClienteJson | undefined)
																	?.cnpj) ||
														'Documento não disponível'}
												</div>
											</div>
										</TableCell>
										<TableCell>{formatDate(alert.data_pedido)}</TableCell>
										<TableCell>{formatDate(alert.data_prevista)}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={getPriorityBadgeColor(alert.priority)}
											>
												{getPriorityLabel(getPriorityNumber(alert.priority))}
											</Badge>
										</TableCell>
										<TableCell>{alert.dias_atraso} dias</TableCell>
										<TableCell>{alert.carrier_info.name}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={getStatusColor(alert.treatment_status)}
											>
												{alert.treatment_status}
											</Badge>
										</TableCell>
										<TableCell>{formatCurrency(alert.total_pedido)}</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation();
													handleOrderClick(alert.numero_pedido);
												}}
											>
												<Eye className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
			{alerts.pagination && alerts.pagination.totalPages > 1 && (
				<div className="flex justify-center gap-2 p-4 border-t border-border bg-muted/5">
					{Array.from(
						{ length: alerts.pagination.totalPages },
						(_, i) => i + 1
					).map((page) => (
						<Button
							key={page}
							variant={page === currentPage ? 'default' : 'outline'}
							size="sm"
							onClick={() => handlePageChange(page)}
							className={`font-medium tracking-tight ${
								page === currentPage
									? 'bg-primary hover:bg-primary/90'
									: 'hover:bg-muted'
							}`}
						>
							{page}
						</Button>
					))}
				</div>
			)}
		</div>
	);
}

export default function AlertsList() {
	return (
		<Suspense
			fallback={
				<div className="bg-card rounded-lg shadow p-4 space-y-4">
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, index) => (
							<div key={index} className="flex gap-4 items-center">
								<Skeleton className="h-12 w-full" />
							</div>
						))}
					</div>
				</div>
			}
		>
			<AlertsContent />
		</Suspense>
	);
}
