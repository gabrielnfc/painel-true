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
		// Tenta converter a string para um objeto Date
		const date = new Date(dateStr);

		// Verifica se a data é válida
		if (isNaN(date.getTime())) {
			// Se a data já estiver no formato DD/MM/YYYY, retorna como está
			if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
				return dateStr;
			}
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
	const query = searchParams.get('q');
	const [result, setResult] = useState<OrderResult | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResults = async () => {
			if (!query) {
				router.push('/orders/search');
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				console.log('Buscando pedido:', query);
				const response = await fetch(
					`/api/orders/search?${searchParams.toString()}`
				);
				const data = await response.json();
				console.log('Resposta da API:', data);

				if (!response.ok) {
					console.error('Erro na API:', data);
					throw new Error(data.error || 'Pedido não encontrado');
				}

				if (!data.results || data.results.length === 0) {
					setError('Pedido não encontrado');
					toast({
						title: 'Erro na busca',
						description: 'Pedido não encontrado',
						variant: 'destructive',
					});
					return;
				}

				setResult(data.results[0]);
			} catch (err) {
				console.error('Erro ao buscar:', err);
				setError('Pedido não encontrado');
				toast({
					title: 'Erro na busca',
					description:
						err instanceof Error ? err.message : 'Erro ao buscar pedido',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchResults();
	}, [query, router, searchParams]);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Skeleton className="h-[600px] w-full" />
			</div>
		);
	}

	if (error || !result) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<Alert variant="destructive">
						<AlertDescription>
							{error || 'Pedido não encontrado'}
						</AlertDescription>
					</Alert>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => router.push('/orders/search')}
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar para busca
					</Button>
				</div>
			</div>
		);
	}

	const cliente = JSON.parse(result.cliente_json);
	const itens = JSON.parse(result.itens_pedido);
	const transportador = result.transportador_json_status
		? JSON.parse(result.transportador_json_status)
		: null;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-5xl mx-auto space-y-8">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">Pedido #{result.numero_pedido}</h1>
					<Button
						variant="outline"
						onClick={() => router.push('/orders/search')}
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar para busca
					</Button>
				</div>

				{/* Detalhes do Pedido */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Package className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Detalhes do Pedido</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<InfoItem
							label="ID Pedido"
							value={result.id_pedido}
							isOrderId={true}
						/>
						<InfoItem label="Número Pedido" value={result.numero_pedido} />
						<InfoItem
							label="Número Ordem Compra"
							value={result.numero_ordem_compra}
							isVtexOrder={true}
						/>
						<InfoItem
							label="Total Produtos"
							value={formatCurrency(result.total_produtos)}
						/>
						<InfoItem
							label="Total Pedido"
							value={formatCurrency(result.total_pedido)}
						/>
						<InfoItem
							label="Valor Desconto"
							value={formatCurrency(result.valor_desconto)}
						/>
						<InfoItem label="Depósito" value={result.deposito} />
						<InfoItem
							label="Frete por Conta"
							value={result.frete_por_conta}
							isShipping={true}
						/>
						<InfoItem
							label="Código Rastreamento"
							value={result.codigo_rastreamento}
						/>
						<InfoItem
							label="Nome Transportador"
							value={result.nome_transportador}
						/>
						<InfoItem label="Forma Frete" value={result.forma_frete} />
						<InfoItem
							label="Data Envio"
							value={result.data_envio}
							isDate={true}
						/>
						<InfoItem
							label="Situação Pedido"
							value={result.situacao_pedido_status}
							isStatus={true}
						/>
						<InfoItem
							label="Data Prevista"
							value={result.data_prevista}
							isDate={true}
						/>
					</div>
				</Card>

				{/* Informações do Cliente */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<User className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Informações do Cliente</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<InfoItem label="Nome" value={cliente.nome} />
						<InfoItem label="Email" value={cliente.email} />
						<InfoItem label="Telefone" value={cliente.fone} />
						<InfoItem label="CPF/CNPJ" value={cliente.cpf_cnpj} />
						<InfoItem
							label="Endereço"
							value={`${cliente.endereco}, ${cliente.numero}`}
						/>
						<InfoItem label="Complemento" value={cliente.complemento} />
						<InfoItem label="Bairro" value={cliente.bairro} />
						<InfoItem
							label="Cidade/UF"
							value={`${cliente.cidade} - ${cliente.uf}`}
						/>
						<InfoItem label="CEP" value={cliente.cep} />
					</div>
				</Card>

				{/* Itens do Pedido */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Package className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Itens do Pedido</h2>
					</div>
					<div className="space-y-4">
						{itens.map((itemData: any, index: number) => {
							const item = itemData.item;
							return (
								<div
									key={index}
									className="flex justify-between items-start py-4 border-b last:border-0"
								>
									<div className="flex-1">
										<p className="font-medium">{item.descricao}</p>
										<div className="mt-1 text-sm text-muted-foreground space-y-1">
											<p>Código: {item.codigo}</p>
											<p>ID Produto: {item.id_produto}</p>
											<p>
												Quantidade: {item.quantidade} {item.unidade}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-medium">
											{formatCurrency(item.valor_unitario)}
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											Valor unitário
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</Card>

				{/* Status do Pedido */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Calendar className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Status do Pedido</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<InfoItem
							label="Data Pedido"
							value={result.data_pedido_status}
							isDate={true}
						/>
						<InfoItem
							label="Data Entrega"
							value={result.data_entrega}
							isDate={true}
						/>
						<InfoItem
							label="Data Faturamento"
							value={result.data_faturamento_status}
							isDate={true}
						/>
						<InfoItem
								label="Situação Pedido"
								value={result.situacao_pedido_status}
								isStatus={true}
							/>
						<InfoItem label="Nome Status" value={result.nome_status} />
						<InfoItem label="Telefone Status" value={result.telefone_status} />
						<InfoItem label="Email Status" value={result.email_status} />
						<InfoItem
							label="Tipo Envio"
							value={result.tipo_envio_transportadora_status}
						/>
						<InfoItem
							label="Status Transportadora"
							value={result.status_transportadora_status}
						/>
						<InfoItem
							label="Data Expedição"
							value={result.data_expedicao_status}
							isDate={true}
						/>
						<InfoItem
							label="Data Coleta"
							value={result.data_coleta_status}
							isDate={true}
						/>
					</div>
				</Card>

				{/* Detalhes do Transportador */}
				{transportador && (
					<Card className="p-6">
						<div className="flex items-center gap-2 mb-4">
							<Truck className="h-5 w-5" />
							<h2 className="text-xl font-semibold">
								Detalhes do Transportador
							</h2>
						</div>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">
										Transportadora
									</p>
									<p className="font-medium">{transportador.nome}</p>
									<p className="text-sm text-muted-foreground mt-2">
										ID: {transportador.id}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Forma de Envio
									</p>
									<p className="font-medium">
										{transportador.formaEnvio?.nome}
									</p>
									<p className="text-sm text-muted-foreground mt-2">
										ID: {transportador.formaEnvio?.id}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
								<div>
									<p className="text-sm text-muted-foreground">
										Forma de Frete
									</p>
									<p className="font-medium">
										{transportador.formaFrete?.nome}
									</p>
									<p className="text-sm text-muted-foreground mt-2">
										ID: {transportador.formaFrete?.id}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">
										Frete por Conta
									</p>
									<p className="font-medium">
										{getShippingResponsibility(transportador.fretePorConta)}
									</p>
								</div>
							</div>

							{transportador.codigoRastreamento && (
								<div className="pt-4 border-t">
									<p className="text-sm text-muted-foreground">
										Código de Rastreamento
									</p>
									<p className="font-medium">
										{transportador.codigoRastreamento}
									</p>
									{transportador.urlRastreamento && (
										<Button
											variant="outline"
											className="mt-2"
											onClick={() =>
												window.open(transportador.urlRastreamento, '_blank')
											}
										>
											Rastrear Pedido
										</Button>
									)}
								</div>
							)}
						</div>
					</Card>
				)}

				{/* Informações Adicionais */}
				<Card className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<Info className="h-5 w-5" />
						<h2 className="text-xl font-semibold">Informações Adicionais</h2>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<InfoItem label="Observações Internas" value={result.obs_interna} />
						<InfoItem label="Numero Nota" value={result.numero_nota} />
						<InfoItem
							label="Chave Acesso Nota"
							value={result.chave_acesso_nota}
							truncate={true}
						/>
						<InfoItem
							label="Valor Nota"
							value={formatCurrency(result.valor_nota)}
						/>
						<InfoItem
							label="Status Transportadora"
							value={result.status_transportadora}
						/>
						<InfoItem
							label="Última Atualização Status"
							value={result.ultima_atualizacao_status}
						/>
						<InfoItem
							label="Código Rastreamento Etiqueta"
							value={result.codigo_rastreamento_etiqueta}
						/>
						<InfoItem
							label="URL Rastreamento Etiqueta"
							value={result.url_rastreamento_etiqueta}
						/>
					</div>
				</Card>

				{/* Botão Voltar */}
				<div className="flex justify-center mt-8">
					<Button
						variant="outline"
						onClick={() => router.push('/orders/search')}
						className="w-full max-w-sm"
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
