'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	ArrowLeft,
	Package,
	Truck,
	User,
	FileText,
	Info,
	Calendar,
	Building2,
	ExternalLink,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

interface OrderResult {
	data_pedido: string;
	data_entrega: string;
	id_pedido: string;
	numero_pedido: string;
	id_nota_fiscal: string;
	numero_ordem_compra: string;
	total_produtos: string;
	total_pedido: string;
	valor_desconto: string;
	deposito: string;
	frete_por_conta: string;
	codigo_rastreamento: string;
	nome_transportador: string;
	forma_frete: string;
	data_envio: string;
	situacao_pedido: string;
	data_prevista: string;
	url_rastreamento: string;
	cliente_json: string;
	itens_pedido: string;
	data_pedido_status: string;
	data_faturamento_status: string;
	situacao_pedido_status: string;
	nome_status: string;
	telefone_status: string;
	email_status: string;
	tipo_envio_transportadora_status: string;
	status_transportadora_status: string;
	data_expedicao_status: string;
	data_coleta_status: string;
	transportador_json_status: string;
	forma_envio_status: string;
	situacao_separacao: string | null;
	numero_nota: string;
	chave_acesso_nota: string;
	valor_nota: string;
	status_transportadora: string;
	ultima_atualizacao_status: string;
	codigo_rastreamento_etiqueta: string | null;
	url_rastreamento_etiqueta: string | null;
	obs_interna: string;
}

function formatCurrency(value: string | number): string {
	const numValue = typeof value === 'string' ? parseFloat(value) : value;
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(numValue);
}

function formatDate(dateStr: string | null | undefined): string {
	if (!dateStr) return 'N/A';

	try {
		// Se a data já estiver no formato DD/MM/YYYY, retorna como está
		if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
			return dateStr;
		}

		// Tenta converter a string para um objeto Date
		const date = new Date(dateStr);

		// Verifica se a data é válida
		if (isNaN(date.getTime())) {
			return 'N/A';
		}

		// Formata a data para DD/MM/YYYY
		return date.toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	} catch {
		return 'N/A';
	}
}

function getOrderStatus(status: string): string {
	const statusMap: { [key: string]: string } = {
		'8': 'Dados Incompletos',
		'0': 'Aberta',
		'3': 'Aprovada',
		'4': 'Preparando Envio',
		'1': 'Faturada',
		'7': 'Pronto Envio',
		'5': 'Enviada',
		'6': 'Entregue',
		'2': 'Cancelada',
		'9': 'Não Entregue',
	};

	return statusMap[status] || status;
}

function getShippingResponsibility(code: string): string {
	const shippingMap: { [key: string]: string } = {
		R: 'Contratação do Frete por conta do Remetente (CIF)',
		D: 'Contratação do Frete por conta do Destinatário (FOB)',
		T: 'Contratação do Frete por conta de Terceiros',
		'3': 'Transporte Próprio por conta do Remetente',
		'4': 'Transporte Próprio por conta do Destinatário',
		S: 'Sem Ocorrência de Transporte',
	};

	return shippingMap[code] || code;
}

function getStatusColor(status: string): string {
	const colorMap: { [key: string]: string } = {
		'8': 'text-yellow-600', // Dados Incompletos
		'0': 'text-blue-600', // Aberta
		'3': 'text-green-600', // Aprovada
		'4': 'text-purple-600', // Preparando Envio
		'1': 'text-blue-600', // Faturada
		'7': 'text-indigo-600', // Pronto Envio
		'5': 'text-orange-600', // Enviada
		'6': 'text-green-600', // Entregue
		'2': 'text-red-600', // Cancelada
		'9': 'text-red-600', // Não Entregue
	};

	return colorMap[status] || '';
}

function InfoItem({
	label,
	value,
	isLink = false,
	isStatus = false,
	isShipping = false,
	isDate = false,
	isOrderId = false,
	isVtexOrder = false,
	link = '',
	customLink = '',
	truncate = false,
}: {
	label: string;
	value: string | null | undefined;
	isLink?: boolean;
	isStatus?: boolean;
	isShipping?: boolean;
	isDate?: boolean;
	isOrderId?: boolean;
	isVtexOrder?: boolean;
	link?: string;
	customLink?: string;
	truncate?: boolean;
}) {
	if (!value || value === 'N/A')
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd className="text-sm text-muted-foreground">N/A</dd>
			</div>
		);

	if (isOrderId) {
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd className="text-sm">
					<a
						href={`https://erp.tiny.com.br/vendas#edit/${value}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						{value}
					</a>
				</dd>
			</div>
		);
	}

	if (isStatus) {
		const statusText = getOrderStatus(value);
		const statusColor = getStatusColor(value);
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd className={`text-sm font-medium ${statusColor}`}>{statusText}</dd>
			</div>
		);
	}

	if (isShipping) {
		const shippingText = getShippingResponsibility(value);
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd className="text-sm">{shippingText}</dd>
			</div>
		);
	}

	if (isDate) {
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd className="text-sm">{formatDate(value)}</dd>
			</div>
		);
	}

	if (isVtexOrder) {
		return (
			<div className="flex flex-col">
				<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
				<dd
					className={`text-sm ${
						isLink ? 'text-primary hover:underline cursor-pointer' : ''
					}`}
				>
					<a
						href={link}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						{value}
					</a>
				</dd>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
			<dd
				className={`text-sm ${
					isLink ? 'text-primary hover:underline cursor-pointer' : ''
				}`}
			>
				{truncate ? `${value.slice(0, 20)}...` : value}
			</dd>
		</div>
	);
}

function ResultsContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [results, setResults] = useState<OrderResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResults = async () => {
			try {
				setLoading(true);
				setError(null);

				const params = new URLSearchParams({
					q: searchParams.get('q') || '',
					page: searchParams.get('page') || '1',
					pageSize: searchParams.get('pageSize') || '10',
				});

				const response = await fetch(`/api/orders/search?${params}`);
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Falha ao buscar resultados');
				}

				const data = await response.json();
				if (!data.data || !Array.isArray(data.data)) {
					throw new Error('Formato de resposta inválido');
				}

				setResults(data.data);
			} catch (err) {
				console.error('Erro ao buscar resultados:', err);
				setError(
					err instanceof Error ? err.message : 'Erro ao buscar resultados'
				);
				toast({
					title: 'Erro',
					description:
						err instanceof Error ? err.message : 'Erro ao buscar resultados',
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		};

		if (searchParams.get('q')) {
			fetchResults();
		}
	}, [searchParams]);

	const handleBack = () => {
		router.push('/ecommerce/orders/search');
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto space-y-6">
					<Skeleton className="h-12 w-32" />
					<Skeleton className="h-[200px] w-full" />
					<Skeleton className="h-[150px] w-full" />
					<Skeleton className="h-[300px] w-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<Button onClick={handleBack} variant="outline" className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	if (results.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<Button onClick={handleBack} variant="outline" className="mb-4">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
					<Alert className="mt-4">
						<AlertDescription>
							Nenhum resultado encontrado para a busca.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto">
				<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mb-6">
					<Button onClick={handleBack} variant="outline" className="mb-2">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</div>

				{results.map((order) => (
					<div key={order.id_pedido} className="space-y-6 mb-12">
						<div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
							<h1 className="text-2xl font-bold flex items-center gap-2">
								<Package className="h-6 w-6" />
								Pedido #{order.numero_pedido}
							</h1>
							<div className="flex items-center gap-2">
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
										order.situacao_pedido
									)
										.replace('text-', 'bg-')
										.replace('600', '100')} ${getStatusColor(
										order.situacao_pedido
									)}`}
								>
									{getOrderStatus(order.situacao_pedido)}
								</span>
							</div>
						</div>

						{/* Detalhes do Pedido */}
						<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-2 mb-6 pb-2 border-b">
								<Package className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Detalhes do Pedido</h2>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<InfoItem
									label="ID Pedido"
									value={order.id_pedido}
									isOrderId={true}
								/>
								<InfoItem label="Número Pedido" value={order.numero_pedido} />
								<InfoItem
									label="Número Ordem Compra"
									value={order.numero_ordem_compra}
									isVtexOrder={true}
									link={`https://tfcucl.myvtex.com/admin/orders/${order.numero_ordem_compra}`}
								/>
								<InfoItem
									label="Total Produtos"
									value={formatCurrency(order.total_produtos)}
								/>
								<InfoItem
									label="Total Pedido"
									value={formatCurrency(order.total_pedido)}
								/>
								<InfoItem
									label="Valor Desconto"
									value={formatCurrency(order.valor_desconto)}
								/>
								<InfoItem label="Depósito" value={order.deposito} />
								<InfoItem
									label="Frete por Conta"
									value={order.frete_por_conta}
									isShipping={true}
								/>
								<InfoItem
									label="Nome Transportador"
									value={order.nome_transportador}
								/>
								<InfoItem label="Forma Frete" value={order.forma_frete} />
								<InfoItem
									label="Data Envio"
									value={order.data_envio}
									isDate={true}
								/>
								<InfoItem
									label="Situação Pedido"
									value={order.situacao_pedido_status}
									isStatus={true}
								/>
								<InfoItem
									label="Data Prevista"
									value={order.data_prevista}
									isDate={true}
								/>
							</div>
						</Card>

						{/* Informações do Cliente */}
						<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-2 mb-6 pb-2 border-b">
								<User className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">
									Informações do Cliente
								</h2>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<InfoItem
									label="Nome"
									value={JSON.parse(order.cliente_json).nome}
								/>
								<InfoItem
									label="Email"
									value={JSON.parse(order.cliente_json).email}
								/>
								<InfoItem
									label="Telefone"
									value={JSON.parse(order.cliente_json).fone}
								/>
								<InfoItem
									label="CPF/CNPJ"
									value={JSON.parse(order.cliente_json).cpf_cnpj}
								/>
								<InfoItem
									label="Endereço"
									value={`${JSON.parse(order.cliente_json).endereco}, ${
										JSON.parse(order.cliente_json).numero
									}`}
								/>
								<InfoItem
									label="Complemento"
									value={JSON.parse(order.cliente_json).complemento}
								/>
								<InfoItem
									label="Bairro"
									value={JSON.parse(order.cliente_json).bairro}
								/>
								<InfoItem
									label="Cidade/UF"
									value={`${JSON.parse(order.cliente_json).cidade} - ${
										JSON.parse(order.cliente_json).uf
									}`}
								/>
								<InfoItem
									label="CEP"
									value={JSON.parse(order.cliente_json).cep}
								/>
							</div>
						</Card>

						{/* Itens do Pedido */}
						<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-2 mb-6 pb-2 border-b">
								<Package className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Itens do Pedido</h2>
							</div>
							<div className="space-y-4">
								{JSON.parse(order.itens_pedido).map(
									(itemData: any, index: number) => {
										const item = itemData.item;
										return (
											<div
												key={index}
												className="flex justify-between items-start p-4 rounded-lg border hover:bg-muted/50 transition-colors"
											>
												<div className="flex-1">
													<p className="font-medium text-lg">
														{item.descricao}
													</p>
													<div className="mt-2 text-sm text-muted-foreground space-y-1">
														<p className="flex items-center gap-2">
															<span className="font-medium">Código:</span>{' '}
															{item.codigo}
														</p>
														<p className="flex items-center gap-2">
															<span className="font-medium">ID Produto:</span>{' '}
															{item.id_produto}
														</p>
														<p className="flex items-center gap-2">
															<span className="font-medium">Quantidade:</span>{' '}
															{item.quantidade} {item.unidade}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-medium text-lg text-primary">
														{formatCurrency(item.valor_unitario)}
													</p>
													<p className="text-sm text-muted-foreground mt-1">
														Valor unitário
													</p>
												</div>
											</div>
										);
									}
								)}
							</div>
						</Card>

						{/* Status do Pedido */}
						<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-2 mb-6 pb-2 border-b">
								<Calendar className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">Status do Pedido</h2>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<InfoItem
									label="Data Pedido"
									value={order.data_pedido_status}
									isDate={true}
								/>
								<InfoItem
									label="Data Entrega"
									value={order.data_entrega}
									isDate={true}
								/>
								<InfoItem
									label="Data Faturamento"
									value={order.data_faturamento_status}
									isDate={true}
								/>
								<InfoItem
									label="Situação Pedido"
									value={order.situacao_pedido_status}
									isStatus={true}
								/>
								<InfoItem label="Nome Status" value={order.nome_status} />
								<InfoItem
									label="Telefone Status"
									value={order.telefone_status}
								/>
								<InfoItem label="Email Status" value={order.email_status} />
								<InfoItem
									label="Tipo Envio"
									value={order.tipo_envio_transportadora_status}
								/>
								<InfoItem
									label="Status Transportadora"
									value={order.status_transportadora_status}
								/>
								<InfoItem
									label="Data Expedição"
									value={order.data_expedicao_status}
									isDate={true}
								/>
								<InfoItem
									label="Data Coleta"
									value={order.data_coleta_status}
									isDate={true}
								/>
							</div>
						</Card>

						{/* Detalhes do Transportador */}
						{order.transportador_json_status && (
							<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
								<div className="flex items-center gap-2 mb-6 pb-2 border-b">
									<Truck className="h-5 w-5 text-primary" />
									<h2 className="text-xl font-semibold">
										Detalhes do Transportador
									</h2>
								</div>
								<div className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="p-4 rounded-lg border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Transportadora
											</p>
											<p className="text-lg font-medium">
												{JSON.parse(order.transportador_json_status).nome}
											</p>
											<p className="text-sm text-muted-foreground mt-2">
												ID: {JSON.parse(order.transportador_json_status).id}
											</p>
										</div>
										<div className="p-4 rounded-lg border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Forma de Envio
											</p>
											<p className="text-lg font-medium">
												{
													JSON.parse(order.transportador_json_status).formaEnvio
														?.nome
												}
											</p>
											<p className="text-sm text-muted-foreground mt-2">
												ID:{' '}
												{
													JSON.parse(order.transportador_json_status).formaEnvio
														?.id
												}
											</p>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
										<div className="p-4 rounded-lg border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Forma de Frete
											</p>
											<p className="text-lg font-medium">
												{
													JSON.parse(order.transportador_json_status).formaFrete
														?.nome
												}
											</p>
											<p className="text-sm text-muted-foreground mt-2">
												ID:{' '}
												{
													JSON.parse(order.transportador_json_status).formaFrete
														?.id
												}
											</p>
										</div>
										<div className="p-4 rounded-lg border">
											<p className="text-sm font-medium text-muted-foreground mb-2">
												Frete por Conta
											</p>
											<p className="text-lg font-medium">
												{getShippingResponsibility(
													JSON.parse(order.transportador_json_status)
														.fretePorConta
												)}
											</p>
										</div>
									</div>

									{/* Rastreamento */}
									{(order.url_rastreamento || order.codigo_rastreamento) && (
										<div className="pt-6 border-t">
											{order.codigo_rastreamento && (
												<div className="mb-4 p-4 rounded-lg border">
													<p className="text-sm font-medium text-muted-foreground mb-2">
														Código de Rastreamento
													</p>
													<p className="text-lg font-medium">
														{order.codigo_rastreamento}
													</p>
												</div>
											)}
											{order.url_rastreamento && (
												<Button
													variant="outline"
													size="lg"
													className="gap-2 w-full md:w-auto"
													onClick={() =>
														window.open(order.url_rastreamento, '_blank')
													}
												>
													Rastrear Pedido
													<ExternalLink className="h-4 w-4" />
												</Button>
											)}
										</div>
									)}
								</div>
							</Card>
						)}

						{/* Informações Adicionais */}
						<Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-2 mb-6 pb-2 border-b">
								<Info className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">
									Informações Adicionais
								</h2>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								<InfoItem
									label="Observações Internas"
									value={order.obs_interna}
								/>
								<InfoItem label="Numero Nota" value={order.numero_nota} />
								<InfoItem
									label="Chave Acesso Nota"
									value={order.chave_acesso_nota}
									truncate={true}
								/>
								<InfoItem
									label="Valor Nota"
									value={formatCurrency(order.valor_nota)}
								/>
								<InfoItem
									label="Status Transportadora"
									value={order.status_transportadora}
								/>
								<InfoItem
									label="Última Atualização Status"
									value={order.ultima_atualizacao_status}
								/>
								<InfoItem
									label="Código Rastreamento Etiqueta"
									value={order.codigo_rastreamento_etiqueta}
								/>
								<InfoItem
									label="URL Rastreamento Etiqueta"
									value={order.url_rastreamento_etiqueta}
								/>
							</div>
						</Card>
					</div>
				))}

				{/* Botão Voltar no final da página */}
				<div className="flex justify-center mt-8 pb-8">
					<Button
						variant="outline"
						onClick={handleBack}
						className="w-full max-w-sm"
						size="lg"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar para busca
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function ResultsPage() {
	return (
		<Suspense fallback={<div>Carregando...</div>}>
			<ResultsContent />
		</Suspense>
	);
}
