'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { InfoItem } from '@/components/ui/info-item';
import { TooltipWrapper } from '@/components/ui/tooltip-content';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileDown, Info, Search } from 'lucide-react';
import ExcelJS from 'exceljs';

interface ReportResult {
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
	nome_cliente?: string;
	cpf?: string;
	telefone?: string;
	email?: string;
	uf?: string;
	cep?: string;
	produtos?: string;
}

// Funções auxiliares
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
		if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
			return dateStr;
		}
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) {
			return 'N/A';
		}
		return date.toLocaleDateString('pt-BR');
	} catch {
		return 'N/A';
	}
}

function formatFretePorConta(codigo: string): string {
	const freteMap: { [key: string]: string } = {
		R: 'CIF (Remetente)',
		D: 'FOB (Destinatário)',
		T: 'Terceiros',
		'3': 'Próprio Remetente',
		'4': 'Próprio Destinatário',
		S: 'Sem Transporte',
	};
	return freteMap[codigo] || codigo;
}

function formatSituacaoSeparacao(codigo: string | null): string {
	if (!codigo) return 'N/A';
	const situacaoMap: { [key: string]: string } = {
		'1': 'Aguardando Separação',
		'2': 'Separada',
		'3': 'Embalada',
		'4': 'Em Separação',
	};
	return situacaoMap[codigo] || codigo;
}

function getTransportadoraNome(transportadorJson: string): string {
	try {
		if (!transportadorJson) return 'N/A';
		const transportador = JSON.parse(transportadorJson);
		return transportador.formaEnvio?.nome || 'N/A';
	} catch (error) {
		console.error('Erro ao parsear JSON da transportadora:', error);
		return 'N/A';
	}
}

function formatProdutos(produtosJson: string): string {
	try {
		const produtos = JSON.parse(produtosJson || '[]');
		return produtos
			.map((item: any) => {
				const quantidade = item.item.quantidade || '1';
				return `${quantidade}x ${item.item.descricao}`;
			})
			.join('\n');
	} catch (error) {
		return 'N/A';
	}
}

export default function ReportPage() {
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<ReportResult[]>([]);
	const [rowsPerPage, setRowsPerPage] = useState<number>(10);
	const [currentPage, setCurrentPage] = useState(1);
	const [isExporting, setIsExporting] = useState(false);

	const paginatedResults =
		results?.length > 0
			? results.slice(
					(currentPage - 1) * rowsPerPage,
					currentPage * rowsPerPage
			  )
			: [];

	const totalPages = Math.ceil((results?.length || 0) / rowsPerPage);

	const handleRowsPerPageChange = (value: number) => {
		setRowsPerPage(value);
		setCurrentPage(1);
	};

	const handleSearch = async () => {
		if (!startDate || !endDate) {
			toast({
				title: 'Erro',
				description: 'Selecione as datas inicial e final',
				variant: 'destructive',
			});
			return;
		}

		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffMonths =
			(end.getFullYear() - start.getFullYear()) * 12 +
			(end.getMonth() - start.getMonth());

		if (diffMonths > 3) {
			toast({
				title: 'Erro',
				description: 'O intervalo máximo permitido é de 3 meses',
				variant: 'destructive',
			});
			return;
		}

		if (end < start) {
			toast({
				title: 'Erro',
				description: 'A data final deve ser maior que a data inicial',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);
		setResults([]);

		try {
			const formattedStartDate = new Date(startDate)
				.toISOString()
				.split('T')[0];
			const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

			const response = await fetch(
				`/api/orders/report?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					cache: 'no-store',
				}
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Erro ao buscar relatório');
			}

			const data = await response.json();
			if (!data.results || !Array.isArray(data.results)) {
				throw new Error('Formato de dados inválido');
			}

			if (data.results.length === 0) {
				toast({
					title: 'Aviso',
					description: 'Nenhum resultado encontrado para o período selecionado',
					variant: 'default',
				});
			}

			setResults(data.results);
			setCurrentPage(1);
		} catch (error) {
			console.error('Erro detalhado:', error);
			toast({
				title: 'Erro',
				description:
					error instanceof Error ? error.message : 'Erro ao gerar relatório',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleExportExcel = async () => {
		if (!results.length) {
			toast({
				title: 'Erro',
				description: 'Não há dados para exportar',
				variant: 'destructive',
			});
			return;
		}

		setIsExporting(true);

		try {
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Relatório de Pedidos');

			// Definir cabeçalhos
			const headers = [
				// Grupo: Informações Básicas
				{ header: 'Data Pedido', key: 'data_pedido' },
				{ header: 'Data Entrega', key: 'data_entrega' },
				{ header: 'Data Faturamento', key: 'data_faturamento' },
				{ header: 'Status', key: 'status' },
				{ header: 'ID Pedido', key: 'id_pedido' },
				{ header: 'Número Pedido', key: 'numero_pedido' },

				// Grupo: Informações Fiscais
				{ header: 'ID Nota Fiscal', key: 'id_nota_fiscal' },
				{ header: 'Número Nota', key: 'numero_nota' },
				{ header: 'Ordem Compra', key: 'ordem_compra' },

				// Grupo: Informações do Cliente
				{ header: 'Cliente', key: 'cliente' },
				{ header: 'CPF/CNPJ', key: 'cpf_cnpj' },
				{ header: 'Telefone', key: 'telefone' },
				{ header: 'Email', key: 'email' },
				{ header: 'UF', key: 'uf' },
				{ header: 'CEP', key: 'cep' },

				// Grupo: Produtos e Frete
				{ header: 'Produtos', key: 'produtos' },
				{ header: 'Transportadora', key: 'transportadora' },
				{ header: 'Forma Frete', key: 'forma_frete' },
				{ header: 'Frete por Conta', key: 'frete_por_conta' },
				{ header: 'Data Prevista', key: 'data_prevista' },

				// Grupo: Status e Separação
				{ header: 'Situação Separação', key: 'situacao_separacao' },
				{ header: 'Data Expedição', key: 'data_expedicao' },
				{ header: 'Data Coleta', key: 'data_coleta' },
				{ header: 'Status Transportadora', key: 'status_transportadora' },
				{ header: 'Última Atualização', key: 'ultima_atualizacao' },
			];

			// Adicionar cabeçalhos
			worksheet.columns = headers;

			// Estilizar cabeçalhos
			const headerRow = worksheet.getRow(1);
			headerRow.font = { bold: true };
			headerRow.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE0E0E0' },
			};
			headerRow.alignment = {
				horizontal: 'center',
				vertical: 'middle',
			};

			// Preparar dados com validação
			const rows = results.map((order) => {
				let cliente;
				try {
					cliente = JSON.parse(order.cliente_json || '{}');
				} catch (error) {
					cliente = {};
				}

				let produtos;
				try {
					produtos = formatProdutos(order.itens_pedido);
				} catch (error) {
					produtos = 'N/A';
				}

				return {
					data_pedido: formatDate(order.data_pedido),
					data_entrega: formatDate(order.data_entrega),
					data_faturamento: formatDate(order.data_faturamento_status),
					status: order.situacao_pedido || 'N/A',
					id_pedido: order.id_pedido || 'N/A',
					numero_pedido: order.numero_pedido || 'N/A',

					id_nota_fiscal: order.id_nota_fiscal || 'N/A',
					numero_nota: order.numero_nota || 'N/A',
					ordem_compra: order.numero_ordem_compra || 'N/A',

					cliente: cliente.nome || 'N/A',
					cpf_cnpj: cliente.cpf_cnpj || 'N/A',
					telefone: cliente.telefone || 'N/A',
					email: cliente.email || 'N/A',
					uf: cliente.uf || 'N/A',
					cep: cliente.cep || 'N/A',

					produtos,
					transportadora: order.nome_transportador || 'N/A',
					forma_frete: order.forma_frete || 'N/A',
					frete_por_conta: formatFretePorConta(order.frete_por_conta),
					data_prevista: formatDate(order.data_prevista),

					situacao_separacao: formatSituacaoSeparacao(order.situacao_separacao),
					data_expedicao: formatDate(order.data_expedicao_status),
					data_coleta: formatDate(order.data_coleta_status),
					status_transportadora: order.status_transportadora || 'N/A',
					ultima_atualizacao: formatDate(order.ultima_atualizacao_status),
				};
			});

			// Validar dados antes de adicionar
			if (!Array.isArray(rows) || rows.length === 0) {
				throw new Error('Dados inválidos para exportação');
			}

			// Adicionar dados
			worksheet.addRows(rows);

			// Aplicar formatação básica em todas as células
			worksheet.eachRow((row, rowNumber) => {
				row.eachCell((cell) => {
					cell.alignment = {
						vertical: 'middle',
						horizontal: 'left',
						wrapText: true,
					};
					row.height = 20;
				});
			});

			// Ajustar largura das colunas
			worksheet.columns.forEach((column) => {
				if (!column) return;
				let maxLength = 0;
				(column as any).eachCell({ includeEmpty: true }, (cell: any) => {
					const columnLength = cell.value ? cell.value.toString().length : 10;
					if (columnLength > maxLength) {
						maxLength = columnLength;
					}
				});
				column.width = Math.min(Math.max(maxLength + 2, 10), 50);
			});

			// Adicionar bordas
			worksheet.eachRow((row) => {
				row.eachCell((cell) => {
					cell.border = {
						top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
						left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
						bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
						right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
					};
				});
			});

			// Gerar arquivo
			const buffer = await workbook.xlsx.writeBuffer();

			if (!buffer || buffer.byteLength === 0) {
				throw new Error('Buffer vazio gerado');
			}

			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `relatorio_pedidos_${
				new Date().toISOString().split('T')[0]
			}.xlsx`;
			link.click();
			window.URL.revokeObjectURL(url);

			toast({
				title: 'Sucesso',
				description: 'Relatório exportado com sucesso',
				variant: 'default',
			});
		} catch (error) {
			console.error('Erro ao exportar:', error);
			toast({
				title: 'Erro',
				description: 'Erro ao exportar relatório. Por favor, tente novamente.',
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="text-3xl font-bold">Relatório de Pedidos</h1>
						<p className="text-muted-foreground mt-2">
							Gere relatórios detalhados dos pedidos por período
						</p>
					</div>
					{results.length > 0 && (
						<Button
							onClick={handleExportExcel}
							variant="outline"
							className="flex items-center gap-2"
							disabled={isExporting}
						>
							{isExporting ? (
								<Spinner className="h-4 w-4" />
							) : (
								<FileDown className="h-4 w-4" />
							)}
							{isExporting ? 'Exportando...' : 'Exportar Excel'}
						</Button>
					)}
				</div>

				<Card className="p-6">
					<div className="space-y-4">
						<Alert className="mb-4">
							<Info className="h-4 w-4" />
							<AlertDescription>
								Selecione um período de até 3 meses para gerar o relatório
							</AlertDescription>
						</Alert>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Data Inicial
								</label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="w-full"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Data Final
								</label>
								<Input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="w-full"
								/>
							</div>
							<div className="flex items-end">
								<Button
									onClick={handleSearch}
									className="w-full h-10"
									disabled={isLoading}
								>
									<Search className="mr-2 h-4 w-4" />
									Buscar
								</Button>
							</div>
						</div>
					</div>
				</Card>

				{isLoading ? (
					<Card className="p-6">
						<div className="flex flex-col items-center justify-center py-8">
							<Spinner className="h-8 w-8 mb-4" />
							<p className="text-muted-foreground">Buscando relatório...</p>
						</div>
					</Card>
				) : results.length > 0 ? (
					<Card className="p-6">
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">
											Mostrar
										</span>
										<Select
											value={rowsPerPage.toString()}
											onValueChange={(value) =>
												handleRowsPerPageChange(parseInt(value))
											}
										>
											<SelectTrigger className="w-[100px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="10">10</SelectItem>
												<SelectItem value="25">25</SelectItem>
												<SelectItem value="50">50</SelectItem>
												<SelectItem value="100">100</SelectItem>
											</SelectContent>
										</Select>
										<span className="text-sm text-muted-foreground">
											linhas
										</span>
									</div>
									<Badge variant="secondary">
										Total: {results.length} pedidos
									</Badge>
								</div>
							</div>

							<div className="rounded-md border overflow-hidden">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/50">
												{/* Grupo: Informações Básicas */}
												<TableHead className="font-semibold sticky left-0 bg-background z-10">
													Data Pedido
												</TableHead>
												<TableHead className="font-semibold">
													Data Entrega
												</TableHead>
												<TableHead className="font-semibold">
													Data Faturamento
												</TableHead>
												<TableHead className="font-semibold">Status</TableHead>
												<TableHead className="font-semibold">
													ID Pedido
												</TableHead>
												<TableHead className="font-semibold">Número</TableHead>

												{/* Grupo: Informações Fiscais */}
												<TableHead className="font-semibold">
													ID Nota Fiscal
												</TableHead>
												<TableHead className="font-semibold">
													Número Nota
												</TableHead>
												<TableHead className="font-semibold">
													Ordem Compra
												</TableHead>

												{/* Grupo: Informações do Cliente */}
												<TableHead className="font-semibold">Cliente</TableHead>
												<TableHead className="font-semibold">
													CPF/CNPJ
												</TableHead>
												<TableHead className="font-semibold">
													Telefone
												</TableHead>
												<TableHead className="font-semibold">Email</TableHead>
												<TableHead className="font-semibold">UF</TableHead>
												<TableHead className="font-semibold">CEP</TableHead>

												{/* Grupo: Produtos e Frete */}
												<TableHead className="font-semibold">
													Produtos
												</TableHead>
												<TableHead className="font-semibold">
													Transportadora
												</TableHead>
												<TableHead className="font-semibold">
													Forma Frete
												</TableHead>
												<TableHead className="font-semibold">
													Frete por Conta
												</TableHead>
												<TableHead className="font-semibold">
													Data Prevista
												</TableHead>

												{/* Grupo: Status e Separação */}
												<TableHead className="font-semibold">
													Situação Separação
												</TableHead>
												<TableHead className="font-semibold">
													Data Expedição
												</TableHead>
												<TableHead className="font-semibold">
													Data Coleta
												</TableHead>
												<TableHead className="font-semibold">
													Status Transp.
												</TableHead>
												<TableHead className="font-semibold">
													Última Atualização
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{paginatedResults.map((order) => {
												const cliente = JSON.parse(order.cliente_json || '{}');
												return (
													<TableRow
														key={order.id_pedido}
														className="hover:bg-muted/50 transition-colors"
													>
														{/* Grupo: Informações Básicas */}
														<TableCell className="font-medium sticky left-0 bg-background z-10">
															<Badge variant="outline">
																{formatDate(order.data_pedido)}
															</Badge>
														</TableCell>
														<TableCell>
															{formatDate(order.data_entrega)}
														</TableCell>
														<TableCell>
															{formatDate(order.data_faturamento_status)}
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	order.situacao_pedido === 'Faturado'
																		? 'success'
																		: order.situacao_pedido === 'Cancelado'
																		? 'destructive'
																		: 'default'
																}
															>
																{order.situacao_pedido}
															</Badge>
														</TableCell>
														<TableCell>
															<TooltipWrapper content="Abrir no Tiny">
																<a
																	href={`https://erp.tiny.com.br/vendas#edit/${order.id_pedido}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-primary hover:underline flex items-center gap-1"
																>
																	{order.id_pedido}
																	<Info className="h-3 w-3" />
																</a>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{order.numero_pedido}</TableCell>

														{/* Grupo: Informações Fiscais */}
														<TableCell>
															<TooltipWrapper
																content={order.id_nota_fiscal || 'N/A'}
															>
																<span className="truncate max-w-[150px] block">
																	{order.id_nota_fiscal || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{order.numero_nota || 'N/A'}</TableCell>
														<TableCell>
															{order.numero_ordem_compra || 'N/A'}
														</TableCell>

														{/* Grupo: Informações do Cliente */}
														<TableCell>
															<TooltipWrapper content={cliente.nome || 'N/A'}>
																<span className="truncate max-w-[200px] block cursor-help">
																	{cliente.nome || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{cliente.cpf_cnpj || 'N/A'}</TableCell>
														<TableCell>{cliente.telefone || 'N/A'}</TableCell>
														<TableCell>
															<TooltipWrapper content={cliente.email || 'N/A'}>
																<span className="truncate max-w-[150px] block">
																	{cliente.email || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{cliente.uf || 'N/A'}</TableCell>
														<TableCell>{cliente.cep || 'N/A'}</TableCell>

														{/* Grupo: Produtos e Frete */}
														<TableCell>
															<TooltipWrapper
																content={formatProdutos(order.itens_pedido)}
																side="left"
															>
																<span className="truncate max-w-[300px] block">
																	{formatProdutos(order.itens_pedido)}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															<TooltipWrapper
																content={order.nome_transportador || 'N/A'}
															>
																<span className="truncate max-w-[150px] block">
																	{order.nome_transportador || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															<TooltipWrapper
																content={order.forma_frete || 'N/A'}
															>
																<span className="truncate max-w-[150px] block">
																	{order.forma_frete || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															<TooltipWrapper
																content={formatFretePorConta(
																	order.frete_por_conta
																)}
															>
																<span className="truncate max-w-[150px] block">
																	{formatFretePorConta(order.frete_por_conta)}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															{formatDate(order.data_prevista)}
														</TableCell>

														{/* Grupo: Status e Separação */}
														<TableCell>
															<TooltipWrapper
																content={formatSituacaoSeparacao(
																	order.situacao_separacao
																)}
															>
																<span className="truncate max-w-[150px] block">
																	{formatSituacaoSeparacao(
																		order.situacao_separacao
																	)}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															{formatDate(order.data_expedicao_status)}
														</TableCell>
														<TableCell>
															{formatDate(order.data_coleta_status)}
														</TableCell>
														<TableCell>
															<TooltipWrapper
																content={order.status_transportadora || 'N/A'}
															>
																<span className="truncate max-w-[150px] block">
																	{order.status_transportadora || 'N/A'}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															{formatDate(order.ultima_atualizacao_status)}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>

							<div className="flex justify-between items-center mt-4">
								<div className="text-sm text-muted-foreground">
									Mostrando {(currentPage - 1) * rowsPerPage + 1} até{' '}
									{Math.min(currentPage * rowsPerPage, results.length)} de{' '}
									{results.length} resultados
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(currentPage - 1)}
										disabled={currentPage === 1}
									>
										Anterior
									</Button>
									<div className="flex items-center gap-2">
										{Array.from({ length: totalPages }, (_, i) => i + 1)
											.filter(
												(page) =>
													page === 1 ||
													page === totalPages ||
													Math.abs(page - currentPage) <= 1
											)
											.map((page, index, array) => (
												<>
													{index > 0 && array[index - 1] !== page - 1 && (
														<span className="text-muted-foreground">...</span>
													)}
													<Button
														key={page}
														variant={
															currentPage === page ? 'default' : 'outline'
														}
														size="sm"
														onClick={() => setCurrentPage(page)}
													>
														{page}
													</Button>
												</>
											))}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(currentPage + 1)}
										disabled={currentPage === totalPages}
									>
										Próxima
									</Button>
								</div>
							</div>
						</div>
					</Card>
				) : startDate && endDate ? (
					<Card className="p-6">
						<div className="flex flex-col items-center justify-center py-8">
							<p className="text-muted-foreground">
								Nenhum resultado encontrado para o período selecionado
							</p>
						</div>
					</Card>
				) : null}
			</div>
		</div>
	);
}
