import { NextResponse } from 'next/server';
import { BigQueryService } from '@/lib/bigquery';
import { systemPrompt } from '@/lib/prompts/system-prompt';

const bigQueryService = new BigQueryService();

export async function POST(request: Request) {
	try {
		const { messages, lastOrderNumber, currentOrderData, isOrderRelatedQuestion } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return NextResponse.json(
				{ error: 'Mensagens inválidas' },
				{ status: 400 }
			);
		}

		const userMessage = messages[messages.length - 1];
		if (!userMessage || !userMessage.content) {
			return NextResponse.json(
				{ error: 'Mensagem do usuário inválida' },
				{ status: 400 }
			);
		}

		// Verifica se é uma busca por pedido
		const orderMatch = userMessage.content.match(/\d{6}/);
		
		// Se é uma pergunta relacionada a pedido
		if (isOrderRelatedQuestion) {
			// Se tem um novo número de pedido, busca no BigQuery
			if (orderMatch) {
				try {
					const orderNumber = orderMatch[0];
					const orderData = await bigQueryService.searchOrder(orderNumber);

					if (!orderData || orderData.length === 0) {
						return NextResponse.json({
							message: `Desculpe, não encontrei nenhum pedido com o número ${orderNumber}. Por favor, verifique o número e tente novamente.`
						});
					}

					const order = orderData[0];
					const formattedResponse = formatOrderResponse(order);
					
					// Retorna tanto a mensagem formatada quanto os dados brutos
					return NextResponse.json({ 
						message: formattedResponse,
						orderData: order // Dados brutos para armazenar no frontend
					});
				} catch (error) {
					console.error('Erro ao buscar pedido:', error);
					return NextResponse.json({
						message: 'Desculpe, ocorreu um erro ao buscar as informações do pedido. Por favor, tente novamente.'
					});
				}
			}
			// Se não tem número novo mas tem dados do pedido atual
			else if (currentOrderData) {
				try {
					// Analisa a pergunta e responde usando os dados existentes
					const response = analyzeOrderQuestion(userMessage.content, currentOrderData);
					return NextResponse.json({ 
						message: response,
						orderData: currentOrderData // Mantém os dados do pedido no contexto
					});
				} catch (error) {
					console.error('Erro ao analisar pergunta:', error);
					return NextResponse.json({
						message: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.'
					});
				}
			}
			// Se não tem número novo nem dados atuais
			else {
				return NextResponse.json({
					message: 'Por favor, me forneça o número do pedido que você deseja consultar (6 dígitos).'
				});
			}
		}

		// Se não for uma pergunta relacionada a pedido
		return NextResponse.json({
			message: 'Como posso ajudar você? Posso buscar informações sobre pedidos, verificar status de entregas, consultar notas fiscais ou analisar dados de transportadoras.'
		});

	} catch (error) {
		console.error('Erro na rota de chat:', error);
		return NextResponse.json(
			{ error: 'Erro interno do servidor' },
			{ status: 500 }
		);
	}
}

function analyzeOrderQuestion(question: string, orderData: any): string {
	// Converte a pergunta para minúsculas para facilitar a comparação
	const q = question.toLowerCase();

	try {
		// Analisa datas
		if (q.includes('dias entre') || q.includes('intervalo')) {
			if (q.includes('faturamento') && q.includes('expedição')) {
				const dataFaturamento = orderData.data_faturamento_status ? new Date(orderData.data_faturamento_status) : null;
				const dataExpedicao = orderData.data_expedicao_status ? new Date(orderData.data_expedicao_status) : null;

				if (dataFaturamento && dataExpedicao) {
					const diffTime = Math.abs(dataExpedicao.getTime() - dataFaturamento.getTime());
					const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
					return `O intervalo entre o faturamento (${dataFaturamento.toLocaleDateString('pt-BR')}) e a expedição (${dataExpedicao.toLocaleDateString('pt-BR')}) é de ${diffDays} dia(s).`;
				}
				return 'Não foi possível calcular o intervalo pois uma ou ambas as datas não estão disponíveis.';
			}
		}

		// Analisa status
		if (q.includes('status') || q.includes('situação')) {
			if (q.includes('envio') || q.includes('entrega')) {
				const status = orderData.situacao_pedido || 'Em processamento';
				return `O status atual do envio é: ${status}`;
			}
			return `O status atual do pedido é: ${orderData.situacao_pedido || 'Em processamento'}`;
		}

		// Analisa rastreamento
		if (q.includes('rastreamento') || q.includes('rastrear')) {
			const codigoRastreamento = orderData.codigo_rastreamento_etiqueta || 
				(orderData.transportador_json_status ? JSON.parse(orderData.transportador_json_status).codigoRastreamento : null);
			
			if (codigoRastreamento) {
				return `O código de rastreamento do pedido é: ${codigoRastreamento}`;
			}
			return 'O código de rastreamento ainda não está disponível.';
		}

		// Se não identificou uma pergunta específica, retorna os dados completos
		return formatOrderResponse(orderData);
	} catch (error) {
		console.error('Erro ao analisar pergunta específica:', error);
		return formatOrderResponse(orderData);
	}
}

function formatOrderResponse(order: any) {
	try {
		// Parse JSON strings with error handling
		const customer = order.cliente_json ? JSON.parse(order.cliente_json) : {};
		const items = order.itens_pedido ? JSON.parse(order.itens_pedido) : [];
		const shipping = order.transportador_json_status ? JSON.parse(order.transportador_json_status) : {};
		const formaEnvio = order.forma_envio_status ? JSON.parse(order.forma_envio_status) : {};

		// Format dates
		const dataPedido = order.data_pedido ? new Date(order.data_pedido).toLocaleDateString('pt-BR') : 'Não informada';
		const dataFaturamento = order.data_faturamento_status ? new Date(order.data_faturamento_status).toLocaleDateString('pt-BR') : 'Não informada';
		const dataExpedicao = order.data_expedicao_status ? new Date(order.data_expedicao_status).toLocaleDateString('pt-BR') : 'Não informada';

		// Format currency values
		const totalPedido = order.total_pedido ? parseFloat(order.total_pedido).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}) : 'R$ 0,00';
		const valorDesconto = order.valor_desconto ? parseFloat(order.valor_desconto).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}) : 'R$ 0,00';
		const valorNota = order.valor_nota ? parseFloat(order.valor_nota).toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}) : 'R$ 0,00';

		// Format items
		const formattedItems = items.map((itemWrapper: any) => {
			const item = itemWrapper.item;
			return `${item.quantidade}x ${item.descricao} - ${parseFloat(item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
		}).join('\n');

		// Build response message
		return `📦 Pedido #${order.numero_pedido}

📝 Informações da Nota Fiscal:
• Número: ${order.numero_nota || 'Não emitida'}
• Chave: ${order.chave_acesso_nota || 'Não disponível'}
• Valor: ${valorNota}

👤 Informações do Cliente:
• Nome: ${customer.nome || 'Não informado'}
• CPF/CNPJ: ${customer.cpf_cnpj || 'Não informado'}
• Email: ${customer.email || 'Não informado'}
• Telefone: ${customer.fone || 'Não informado'}

📍 Endereço de Entrega:
• ${customer.endereco}, ${customer.numero}${customer.complemento ? ` - ${customer.complemento}` : ''}
• ${customer.bairro}
• ${customer.cidade}/${customer.uf}
• CEP: ${customer.cep}

💰 Informações do Pedido:
• Data do Pedido: ${dataPedido}
• Total dos Produtos: ${totalPedido}
• Desconto Aplicado: ${valorDesconto}
• Status: ${order.situacao_pedido || 'Em processamento'}

🚚 Informações de Envio:
• Transportadora: ${shipping.nome || order.nome_transportador || 'Não definida'}
• Forma de Envio: ${formaEnvio.nome || shipping.formaEnvio?.nome || 'Não informada'}
• Tipo de Frete: ${order.forma_frete || 'Não informado'}
• Frete por Conta: ${order.frete_por_conta === 'R' ? 'Remetente' : 'Destinatário'}
• Código de Rastreamento: ${order.codigo_rastreamento_etiqueta || shipping.codigoRastreamento || 'Não disponível'}
• URL de Rastreamento: ${order.url_rastreamento_etiqueta || shipping.urlRastreamento || 'Não disponível'}

📅 Datas Importantes:
• Faturamento: ${dataFaturamento}
• Expedição: ${dataExpedicao}
• Previsão de Entrega: ${order.data_prevista ? new Date(order.data_prevista).toLocaleDateString('pt-BR') : 'Não informada'}

📦 Itens do Pedido:
${formattedItems || 'Nenhum item encontrado'}

💬 Observações: ${order.obs_interna || 'Nenhuma observação'}`;
	} catch (err: unknown) {
		console.error('Erro ao formatar resposta:', err);
		const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
		return `Desculpe, ocorreu um erro ao formatar as informações do pedido. Por favor, tente novamente.
Detalhes do erro: ${errorMessage}`;
	}
} 