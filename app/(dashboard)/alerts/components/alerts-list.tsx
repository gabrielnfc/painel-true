'use client';

import { useEffect, useState } from 'react';
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
import { getPriorityColor, getPriorityLabel } from '@/lib/utils/priority-utils';
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
import type { AlertsResponse } from '@/types/alerts';
import { PriorityIndicator } from '@/components/priority-indicator';

export default function AlertsList() {
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
		router.push(`/treatments/${orderId}`);
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

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800';
			case 'resolved':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500 border-gray-200 dark:border-gray-800';
		}
	};

	const getPriorityBadgeColor = (priority: string) => {
		switch (priority) {
			case 'low':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
			case 'high':
				return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500 border-orange-200 dark:border-orange-800';
			case 'critical':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-red-200 dark:border-red-800';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500 border-gray-200 dark:border-gray-800';
		}
	};

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
									<TableHead className="w-[60px] text-right">
										<span className="font-semibold text-sm tracking-tight">
											Ações
										</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{alerts.data.map((order) => {
									const customerData = formatCustomerData(order.cliente_json);

									return (
										<TableRow
											key={order.id_pedido}
											className="group hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors relative"
										>
											<TableCell className="max-w-[120px] relative">
												<div
													className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
														order.priority_level === 'critical'
															? 'bg-red-500'
															: order.priority_level === 'high'
															? 'bg-orange-500'
															: order.priority_level === 'medium'
															? 'bg-yellow-500'
															: 'bg-green-500'
													} opacity-0 group-hover:opacity-100`}
												/>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="cursor-help">
																<span className="font-semibold text-primary hover:text-primary/80 transition-colors tracking-wide block truncate">
																	{order.numero_pedido}
																</span>
																<div className="text-[11px] text-muted-foreground mt-0.5 tracking-tight truncate">
																	ID: {order.id_pedido}
																</div>
															</div>
														</TooltipTrigger>
														<TooltipContent className="text-[12px] tracking-tight">
															<div className="space-y-1">
																<p className="font-semibold">
																	Detalhes do Pedido
																</p>
																<div className="space-y-1">
																	<p>
																		Nota Fiscal: {order.numero_nota || 'N/A'}
																	</p>
																	<p>
																		Rastreamento:{' '}
																		{order.codigo_rastreamento || 'N/A'}
																	</p>
																	{order.carrier_info.tracking_url !== '-' && (
																		<a
																			href={order.carrier_info.tracking_url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="text-primary hover:underline inline-flex items-center gap-1"
																		>
																			Rastrear
																			<ExternalLink className="h-3 w-3" />
																		</a>
																	)}
																</div>
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell className="max-w-[200px]">
												<div className="flex flex-col">
													<span className="font-medium tracking-tight text-foreground/90 truncate">
														{customerData.name}
													</span>
													<span className="text-[11px] text-muted-foreground tracking-tight truncate">
														{customerData.document}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<span className="whitespace-nowrap font-medium tracking-tight">
																{formatDate(order.data_pedido)}
															</span>
														</TooltipTrigger>
														<TooltipContent>
															Data de criação do pedido
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<span className="whitespace-nowrap font-medium tracking-tight">
																{formatDate(order.data_prevista)}
															</span>
														</TooltipTrigger>
														<TooltipContent>
															Data prevista para entrega
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<Badge
																className={`${getPriorityBadgeColor(
																	order.priority_level
																)} min-w-[80px] justify-center font-semibold tracking-tight text-[12px] border`}
															>
																<PriorityIndicator
																	level={order.priority_level}
																	className="mr-1.5"
																/>
																<span className="capitalize">
																	{order.priority_level === 'low'
																		? 'Baixa'
																		: order.priority_level === 'medium'
																		? 'Média'
																		: order.priority_level === 'high'
																		? 'Alta'
																		: order.priority_level === 'critical'
																		? 'Crítica'
																		: order.priority_level}
																</span>
															</Badge>
														</TooltipTrigger>
														<TooltipContent>
															<div className="space-y-1">
																<p className="font-semibold">
																	Nível de Prioridade
																</p>
																<p className="text-sm">
																	Baseado no tempo de atraso e histórico do
																	pedido
																</p>
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<Badge
																variant="outline"
																className="font-semibold text-[12px] tracking-tight"
															>
																{order.dias_atraso}{' '}
																{order.dias_atraso === 1 ? 'dia' : 'dias'}
															</Badge>
														</TooltipTrigger>
														<TooltipContent>
															Dias em atraso desde a data prevista
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell className="max-w-[140px]">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger>
															<div className="flex flex-col">
																<div className="flex items-center gap-1.5">
																	<Truck className="h-4 w-4 text-muted-foreground shrink-0" />
																	<span className="font-medium tracking-tight truncate">
																		{order.carrier_info.name}
																	</span>
																</div>
																{order.carrier_info.shipping !== '-' && (
																	<span className="text-[11px] text-muted-foreground ml-5 tracking-tight truncate">
																		{order.carrier_info.shipping}
																	</span>
																)}
															</div>
														</TooltipTrigger>
														<TooltipContent className="space-y-2">
															<div className="space-y-1">
																<div className="flex items-center gap-1.5">
																	<Package className="h-3.5 w-3.5" />
																	<p>
																		Protocolo: {order.carrier_info.protocol}
																	</p>
																</div>
																<div className="flex items-center gap-1.5">
																	<Clock className="h-3.5 w-3.5" />
																	<p>
																		Última atualização:{' '}
																		{order.carrier_info.last_update}
																	</p>
																</div>
															</div>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
											<TableCell>
												<Badge
													className={`${getStatusColor(
														order.treatment_status
													)} transition-colors font-semibold tracking-tight text-[12px] border`}
												>
													{order.treatment_status === 'pending'
														? 'Pendente'
														: order.treatment_status === 'in_progress'
														? 'Em Andamento'
														: order.treatment_status === 'resolved'
														? 'Resolvido'
														: order.treatment_status}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5">
													<DollarSign className="h-4 w-4 text-muted-foreground" />
													<span className="font-semibold tracking-tight">
														{formatCurrency(order.total_pedido)}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																onClick={() =>
																	handleOrderClick(order.numero_pedido)
																}
																className="hover:bg-primary/10 transition-colors group"
															>
																<Eye className="h-4 w-4 transition-colors group-hover:text-primary" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															Ver detalhes do pedido
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</TableCell>
										</TableRow>
									);
								})}
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
