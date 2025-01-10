'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './status-badge';
import { PriorityIndicator } from './priority-indicator';
import { Timeline } from './timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils/format-utils';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { Treatment } from '@/lib/types/treatment';

interface OrderDetailsProps {
	order: any;
}

export function OrderDetails({ order }: OrderDetailsProps) {
	const cliente =
		typeof order.cliente_json === 'string'
			? JSON.parse(order.cliente_json)
			: order.cliente_json || {};

	const transportador =
		typeof order.transportador_json === 'string'
			? JSON.parse(order.transportador_json)
			: order.transportador_json || {};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Pedido #{order.numero_pedido}</h1>
					<p className="text-sm text-muted-foreground">
						NF: {order.numero_nota || 'N/A'}
					</p>
				</div>
				<PriorityIndicator
					level={order.priority_level || 1}
					daysDelayed={order.dias_atraso || 0}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Status de Entrega</p>
							<StatusBadge status={order.situacao_pedido} type="delivery" />
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Status da Transportadora
							</p>
							<StatusBadge
								status={order.status_transportadora || 'pending'}
								type="delivery"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Progresso</CardTitle>
					</CardHeader>
					<CardContent>
						<Timeline order={order} />
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="p-6">
					<Tabs defaultValue="customer" className="space-y-4">
						<TabsList>
							<TabsTrigger value="customer">Cliente</TabsTrigger>
							<TabsTrigger value="delivery">Entrega</TabsTrigger>
							<TabsTrigger value="products">Produtos</TabsTrigger>
							<TabsTrigger value="financial">Financeiro</TabsTrigger>
						</TabsList>

						<TabsContent value="customer" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Nome</p>
									<p className="text-lg font-medium">{cliente.nome}</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Documento</p>
									<p className="text-lg font-medium">
										{cliente.cpf || cliente.cnpj || 'N/A'}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Phone className="h-4 w-4 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">Telefone</p>
								</div>
								<p className="text-lg font-medium">
									{cliente.fone || cliente.celular || 'N/A'}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">Email</p>
								</div>
								<p className="text-lg font-medium">{cliente.email || 'N/A'}</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-muted-foreground" />
									<p className="text-sm text-muted-foreground">Endereço</p>
								</div>
								<p className="text-lg font-medium">
									{order.endereco_completo || 'N/A'}
								</p>
							</div>
						</TabsContent>

						<TabsContent value="delivery" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Transportadora
									</p>
									<p className="text-lg font-medium">
										{order.nome_transportador || 'N/A'}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Forma de Envio
									</p>
									<p className="text-lg font-medium">
										{order.forma_frete || 'N/A'}
									</p>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Código de Rastreamento
									</p>
									<div className="flex items-center gap-2">
										<p className="text-lg font-medium">
											{order.codigo_rastreamento || 'N/A'}
										</p>
										{order.url_rastreamento && (
											<a
												href={order.url_rastreamento}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:underline"
											>
												<ExternalLink className="h-4 w-4" />
											</a>
										)}
									</div>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Última Atualização
									</p>
									<p className="text-lg font-medium">
										{order.ultima_atualizacao_status
											? formatDate(order.ultima_atualizacao_status)
											: 'N/A'}
									</p>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Data do Pedido
									</p>
									<p className="text-lg font-medium">
										{formatDate(order.data_pedido)}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Previsão de Entrega
									</p>
									<p className="text-lg font-medium">
										{formatDate(order.data_prevista)}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Data de Entrega
									</p>
									<p className="text-lg font-medium">
										{order.data_entrega
											? formatDate(order.data_entrega)
											: 'Pendente'}
									</p>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="products">
							<ScrollArea className="h-[300px]">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Produto</TableHead>
											<TableHead>SKU</TableHead>
											<TableHead className="text-right">Qtd</TableHead>
											<TableHead className="text-right">Valor Unit.</TableHead>
											<TableHead className="text-right">Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{order.itens?.map((item: any, index: number) => (
											<TableRow key={index}>
												<TableCell className="font-medium">
													{item.nome}
												</TableCell>
												<TableCell>{item.sku}</TableCell>
												<TableCell className="text-right">
													{item.quantidade}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(item.valor_unitario)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(item.valor_total)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</ScrollArea>
						</TabsContent>

						<TabsContent value="financial" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-3">
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">
										Total Produtos
									</p>
									<p className="text-lg font-medium">
										{formatCurrency(order.total_produtos)}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Desconto</p>
									<p className="text-lg font-medium">
										{formatCurrency(order.valor_desconto)}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm text-muted-foreground">Total Pedido</p>
									<p className="text-lg font-medium">
										{formatCurrency(order.total_pedido)}
									</p>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{order.obs_interna && (
				<Card>
					<CardHeader>
						<CardTitle>Observações Internas</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{order.obs_interna}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
