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
} from "@/components/ui/select";
import { Spinner } from '@/components/ui/spinner';
import { InfoItem } from '@/components/ui/info-item';
import { TooltipWrapper } from '@/components/ui/tooltip-content';
import ExcelJS from 'exceljs';

interface ReportResult {
	data_pedido: string;
	data_entrega: string;
	data_faturamento: string;
	situacao_pedido: string;
	id_pedido: string;
	id_nota_fiscal: string;
	numero_tiny: string;
	numero_ordem_compra: string;
	numero_nota_fiscal: string;
	nome_cliente: string;
	cpf: string;
	telefone: string;
	email: string;
	uf: string;
	cep: string;
	produtos: string;
	transportadora: string;
	forma_frete: string;
	frete_por_conta: string;
	data_prevista: string;
	situacao_separacao: string | null;
	data_expedicao_status: string;
	data_coleta_status: string;
	status_transportadora: string;
	ultima_atualizacao_status: string;
	transportador_json_status: string;
}

// Adicionar funções auxiliares para transformação dos códigos
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

// Função auxiliar para extrair nome da transportadora
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

// Função auxiliar para formatar produtos
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

	// Calcular resultados paginados
	const paginatedResults = results.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	const totalPages = Math.ceil(results.length / rowsPerPage);

	// Resetar página atual quando mudar número de linhas por página
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

		// Validar intervalo máximo de 3 meses
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

		try {
			// Format dates to YYYY-MM-DD for BigQuery
			const formattedStartDate = new Date(startDate)
				.toISOString()
				.split('T')[0];
			const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

			const response = await fetch(
				`/api/orders/report?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
			);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Erro ao buscar relatório');
			}

			setResults(data.results);
		} catch (error) {
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

	const handleExportExcel = () => {
		if (results.length === 0) {
			toast({
				title: 'Erro',
				description: 'Não há dados para exportar',
				variant: 'destructive',
			});
			return;
		}

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Relatório de Pedidos');

		// Define as colunas
		worksheet.columns = [
			{ header: 'Data Pedido', key: 'data_pedido' },
			{ header: 'Data Entrega', key: 'data_entrega' },
			{ header: 'Data Faturamento', key: 'data_faturamento' },
			{ header: 'Situação', key: 'situacao_pedido' },
			{ header: 'ID Pedido', key: 'id_pedido' },
			{ header: 'ID Nota Fiscal', key: 'id_nota_fiscal' },
			{ header: 'Número Tiny', key: 'numero_tiny' },
			{ header: 'Número OC', key: 'numero_ordem_compra' },
			{ header: 'Número NF', key: 'numero_nota_fiscal' },
			{ header: 'Cliente', key: 'nome_cliente' },
			{ header: 'CPF/CNPJ', key: 'cpf' },
			{ header: 'Telefone', key: 'telefone' },
			{ header: 'Email', key: 'email' },
			{ header: 'UF', key: 'uf' },
			{ header: 'CEP', key: 'cep' },
			{ header: 'Produtos', key: 'produtos' },
			{ header: 'Transportadora', key: 'transportadora' },
			{ header: 'Forma Frete', key: 'forma_frete' },
			{ header: 'Frete por Conta', key: 'frete_por_conta' },
			{ header: 'Data Prevista', key: 'data_prevista' },
			{ header: 'Situação Separação', key: 'situacao_separacao' },
			{ header: 'Data Expedição', key: 'data_expedicao_status' },
			{ header: 'Data Coleta', key: 'data_coleta_status' },
			{ header: 'Status Transportadora', key: 'status_transportadora' },
			{ header: 'Última Atualização', key: 'ultima_atualizacao_status' },
		];

		// Adiciona os dados
		results.forEach(row => {
			worksheet.addRow({
				...row,
				produtos: formatProdutos(row.produtos).replace(/\n/g, ', '),
				transportadora: getTransportadoraNome(row.transportador_json_status),
				frete_por_conta: formatFretePorConta(row.frete_por_conta),
				situacao_separacao: formatSituacaoSeparacao(row.situacao_separacao),
			});
		});

		// Ajusta o tamanho das colunas
		worksheet.columns.forEach((column) => {
			column.width = 20;
		});

		// Gera o arquivo
		workbook.xlsx.writeBuffer().then((buffer) => {
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `relatorio-pedidos-${startDate}-a-${endDate}.xlsx`;
			a.click();
			window.URL.revokeObjectURL(url);
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Relatório Geral de Pedidos</h1>
					<p className="text-muted-foreground mt-2">
						Visualize e analise os pedidos por período
					</p>
				</div>
			</div>

			<Card className="p-6">
				<div className="space-y-4">
					<div className="flex gap-4 items-end">
						<div className="flex-1">
							<label className="block text-sm font-medium mb-2">
								Data Inicial
							</label>
							<Input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium mb-2">
								Data Final
							</label>
							<Input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
						<Button onClick={handleSearch} disabled={isLoading}>
							{isLoading ? <Spinner className="h-4 w-4 mr-2" /> : null}
							Gerar Relatório
						</Button>
						{results.length > 0 && (
							<Button onClick={handleExportExcel} variant="outline">
								Exportar Excel
							</Button>
						)}
					</div>

					{results.length > 0 && (
						<div className="mt-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										Linhas por página:
									</span>
									<Select
										value={rowsPerPage.toString()}
										onValueChange={(value) => handleRowsPerPageChange(Number(value))}
									>
										<SelectTrigger className="w-[80px]">
											<SelectValue placeholder="10" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">10</SelectItem>
											<SelectItem value="50">50</SelectItem>
											<SelectItem value="100">100</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="text-sm text-muted-foreground">
									Total de registros: {results.length}
								</div>
							</div>

							<div className="rounded-lg border bg-card">
								<div className="relative w-full overflow-auto">
									<div className="max-h-[600px] overflow-auto">
										<Table>
											<TableHeader className="sticky top-0 z-20 bg-muted">
												<TableRow className="bg-muted/50">
													{/* Grupo: Informações Básicas */}
													<TableHead className="bg-muted/50 font-semibold sticky left-0 z-20">
														Data Pedido
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Data Entrega
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Data Faturamento
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Situação
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														ID Pedido
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Número Tiny
													</TableHead>

													{/* Grupo: Informações Fiscais */}
													<TableHead className="bg-muted/50 font-semibold">
														ID NF
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Número NF
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Número OC
													</TableHead>

													{/* Grupo: Informações do Cliente */}
													<TableHead className="bg-muted/50 font-semibold">
														Cliente
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														CPF/CNPJ
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Telefone
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Email
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														UF
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														CEP
													</TableHead>

													{/* Grupo: Produtos e Frete */}
													<TableHead className="bg-muted/50 font-semibold">
														Produtos
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Transportadora
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Forma Frete
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Frete por Conta
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Data Prevista
													</TableHead>

													{/* Grupo: Status e Separação */}
													<TableHead className="bg-muted/50 font-semibold">
														Situação Separação
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Data Expedição
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Data Coleta
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Status Transp.
													</TableHead>
													<TableHead className="bg-muted/50 font-semibold">
														Última Atualização
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{paginatedResults.map((order) => (
													<TableRow
														key={order.id_pedido}
														className="hover:bg-muted/50"
													>
														{/* Grupo: Informações Básicas */}
														<TableCell className="font-medium sticky left-0 bg-background z-10">
															{order.data_pedido}
														</TableCell>
														<TableCell>{order.data_entrega || 'N/A'}</TableCell>
														<TableCell>
															{order.data_faturamento || 'N/A'}
														</TableCell>
														<TableCell>
															<InfoItem
																label=""
																value={order.situacao_pedido}
																isStatus={true}
															/>
														</TableCell>
														<TableCell>
															<InfoItem
																label=""
																value={order.id_pedido}
																isOrderId={true}
															/>
														</TableCell>
														<TableCell>{order.numero_tiny}</TableCell>

														{/* Grupo: Informações Fiscais */}
														<TableCell>
															<TooltipWrapper content={order.id_nota_fiscal}>
																<span className="truncate max-w-[150px] block">
																	{order.id_nota_fiscal}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{order.numero_nota_fiscal}</TableCell>
														<TableCell>{order.numero_ordem_compra}</TableCell>

														{/* Grupo: Informações do Cliente */}
														<TableCell className="font-medium">
															<TooltipWrapper content={order.nome_cliente}>
																<span className="truncate max-w-[200px] block">
																	{order.nome_cliente}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{order.cpf}</TableCell>
														<TableCell>{order.telefone}</TableCell>
														<TableCell>
															<TooltipWrapper content={order.email}>
																<span className="truncate max-w-[150px] block">
																	{order.email}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>{order.uf}</TableCell>
														<TableCell>{order.cep}</TableCell>

														{/* Grupo: Produtos e Frete */}
														<TableCell>
															<TooltipWrapper 
																content={formatProdutos(order.produtos)}
																side="left"
															>
																<span className="truncate max-w-[300px] block">
																	{formatProdutos(order.produtos)}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															<TooltipWrapper content={getTransportadoraNome(order.transportador_json_status)}>
																<span className="truncate max-w-[150px] block">
																	{getTransportadoraNome(order.transportador_json_status)}
																</span>
															</TooltipWrapper>
														</TableCell>
														<TableCell>
															<TooltipWrapper content={order.forma_frete}>
																<span className="truncate max-w-[150px] block">
																	{order.forma_frete}
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
														<TableCell>{order.data_prevista || 'N/A'}</TableCell>

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
															{order.data_expedicao_status || 'N/A'}
														</TableCell>
														<TableCell>
															{order.data_coleta_status || 'N/A'}
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
															{order.ultima_atualizacao_status || 'N/A'}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							</div>

							{totalPages > 1 && (
								<div className="mt-4 flex items-center justify-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
										disabled={currentPage === 1}
									>
										Anterior
									</Button>
									<span className="text-sm text-muted-foreground">
										Página {currentPage} de {totalPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
										disabled={currentPage === totalPages}
									>
										Próxima
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</Card>

			<style jsx global>{`
				.sticky-header {
					position: sticky;
					top: 0;
					z-index: 10;
					background-color: var(--background);
				}

				.table-container {
					overflow-x: auto;
					scrollbar-width: thin;
					scrollbar-color: var(--border) transparent;
				}

				.table-container::-webkit-scrollbar {
					height: 8px;
				}

				.table-container::-webkit-scrollbar-track {
					background: transparent;
				}

				.table-container::-webkit-scrollbar-thumb {
					background-color: var(--border);
					border-radius: 4px;
				}

				.max-h-[600px] {
					max-height: 600px;
				}
			`}</style>
		</div>
	);
}
