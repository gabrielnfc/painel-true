import { OpenAI } from 'openai';
import { bigQueryService } from '@/lib/bigquery';
import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/prompts/system-prompt';

// Função auxiliar para formatar os dados do pedido
function formatOrderData(order: any) {
	// Mapeia os status do pedido
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
		'9': 'Não Entregue'
	};

	// Mapeia os tipos de frete
	const freteMap: { [key: string]: string } = {
		'R': 'CIF (Remetente)',
		'D': 'FOB (Destinatário)',
		'T': 'Terceiros',
		'3': 'Próprio Remetente',
		'4': 'Próprio Destinatário',
		'S': 'Sem Transporte'
	};

	// Tenta fazer o parse do JSON do cliente
	let clienteInfo = {};
	try {
		clienteInfo = JSON.parse(order.cliente_json || '{}');
	} catch (e) {
		console.warn('Erro ao fazer parse do JSON do cliente:', e);
	}

	return `
Aqui estão os detalhes do pedido solicitado:

📦 Pedido #${order.numero_pedido}
📅 Data do pedido: ${order.data_pedido}
✅ Status: ${statusMap[order.situacao_pedido] || order.situacao_pedido}

👤 Informações do Cliente:
${clienteInfo.nome ? `- Nome: ${clienteInfo.nome}` : ''}
${clienteInfo.cpf_cnpj ? `- CPF/CNPJ: ${clienteInfo.cpf_cnpj}` : ''}
${clienteInfo.email ? `📧 Email: ${clienteInfo.email}` : ''}
${clienteInfo.fone ? `📱 Telefone: ${clienteInfo.fone}` : ''}

🚚 Informações de Entrega:
- Transportadora: ${order.nome_transportador || 'Não definida'}
- Tipo de frete: ${freteMap[order.frete_por_conta] || order.frete_por_conta}
${order.codigo_rastreamento ? `- Código de rastreamento: ${order.codigo_rastreamento}` : ''}
${order.url_rastreamento ? `- URL de rastreamento: ${order.url_rastreamento}` : ''}
${order.data_entrega ? `- Data prevista de entrega: ${order.data_entrega}` : ''}

💳 Informações Financeiras:
- Valor total dos produtos: R$ ${order.total_produtos}
- Valor total do pedido: R$ ${order.total_pedido}
${order.valor_desconto ? `- Desconto aplicado: R$ ${order.valor_desconto}` : ''}

📝 Nota Fiscal:
${order.numero_nota ? `- Número: ${order.numero_nota}` : '- Ainda não emitida'}
${order.chave_acesso_nota ? `- Chave de acesso: ${order.chave_acesso_nota}` : ''}

${order.obs_interna ? `💬 Observações internas:\n${order.obs_interna}` : ''}`;
}

export async function POST(req: Request) {
	try {
		console.log('Iniciando processamento da requisição de chat');

		// Check for API key before processing
		if (!process.env.OPENAI_API_KEY) {
			console.error('OpenAI API key is missing. Please add OPENAI_API_KEY to your environment variables.');
			return NextResponse.json(
				{ error: 'OpenAI API key is not configured. Please contact the administrator.' },
				{ status: 500 }
			);
		}

		const { messages } = await req.json();
		console.log('Mensagens recebidas:', messages);

		// Verifica se há um número de pedido na última mensagem
		const lastMessage = messages[messages.length - 1].content;
		console.log('Última mensagem:', lastMessage);
		
		// Primeiro tenta encontrar um número com hífen (para numero_ordem_compra)
		let orderMatch = lastMessage.match(/\b\d+(?:-\d+)?\b/);
		let isOrderNumberSearch = false;

		// Se não encontrou com hífen, procura apenas números
		if (!orderMatch) {
			orderMatch = lastMessage.match(/\b\d+\b/);
		} else {
			// Se encontrou com hífen, verifica se é realmente um número de ordem de compra
			isOrderNumberSearch = lastMessage.toLowerCase().includes('ordem') || 
				lastMessage.toLowerCase().includes('compra') ||
				lastMessage.includes('-');
		}

		console.log('Número encontrado:', orderMatch?.[0]);
		console.log('É busca por ordem de compra:', isOrderNumberSearch);

		// Se a mensagem contém um número que parece ser um pedido, SEMPRE aguardar o BigQuery
		if (orderMatch) {
			try {
				// Se não for busca por número de ordem de compra, remove o hífen
				const searchValue = isOrderNumberSearch 
					? orderMatch[0] 
					: orderMatch[0].replace(/-/g, '');

				console.log('Iniciando busca no BigQuery com valor:', searchValue);
				
				// Aguarda explicitamente a resposta do BigQuery
				const results = await bigQueryService.searchOrder(searchValue);
				console.log('Resultados do BigQuery:', results?.length || 0, 'pedidos encontrados');

				if (results && results.length > 0) {
					console.log('Pedido encontrado, processando resposta');
					
					// Initialize OpenAI client
					const openai = new OpenAI({
						apiKey: process.env.OPENAI_API_KEY,
					});

					// Formata os dados do pedido
					const formattedOrderData = formatOrderData(results[0]);

					const completion = await openai.chat.completions.create({
						model: 'gpt-4',
						messages: [
							{
								role: 'system',
								content: systemPrompt + `\n\nIMPORTANTE: Você deve usar APENAS as informações fornecidas abaixo e manter o formato com os ícones conforme especificado acima. NUNCA invente ou suponha informações que não estejam presentes nos dados.\n\n${formattedOrderData}`,
							},
							...messages,
						],
						temperature: 0.3, // Reduzido ainda mais para garantir consistência
						max_tokens: 1000,
					});

					return NextResponse.json({
						message: completion.choices[0].message.content,
					});
				} else {
					console.log('Nenhum pedido encontrado');
					return NextResponse.json({
						message: `❌ Não encontrei nenhum pedido com o número fornecido: ${searchValue}.\n` +
							'⚠️ O número foi informado corretamente? Por favor, verifique e me envie novamente.\n\n' +
							'🔍 Lembre-se que você pode buscar por:\n' +
							'- ID do pedido (apenas números)\n' +
							'- Número do pedido (apenas números)\n' +
							'- ID da nota fiscal (apenas números)\n' +
							'- Número da ordem de compra (pode conter hífen, exemplo: 1234567890-01)',
					});
				}
			} catch (error) {
				console.error('Erro detalhado ao buscar pedido:', error);
				return NextResponse.json(
					{ error: 'Erro ao buscar informações do pedido. Por favor, tente novamente em alguns instantes.' },
					{ status: 500 }
				);
			}
		} else {
			// Se não há número de pedido na mensagem, processa normalmente com o OpenAI
			// Initialize OpenAI client
			const openai = new OpenAI({
				apiKey: process.env.OPENAI_API_KEY,
			});

			console.log('Processando mensagem sem busca de pedido');
			const completion = await openai.chat.completions.create({
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: systemPrompt + '\n\nIMPORTANTE: Você deve responder APENAS com base nas informações que você tem certeza. NUNCA invente ou suponha informações sobre pedidos. Se o usuário perguntar sobre um pedido específico, peça o número do pedido.',
					},
					...messages,
				],
				temperature: 0.5, // Reduzido para diminuir criatividade
				max_tokens: 1000,
			});

			return NextResponse.json({
				message: completion.choices[0].message.content,
			});
		}
	} catch (error) {
		console.error('Erro detalhado na rota de chat:', error);
		
		// Verifica se é um erro de timeout
		if (error instanceof Error && error.message.includes('timeout')) {
			return NextResponse.json(
				{ error: 'A operação demorou muito para responder. Por favor, tente novamente em alguns instantes.' },
				{ status: 504 }
			);
		}

		// Erro genérico
		return NextResponse.json(
			{ error: 'Erro ao processar a mensagem. Por favor, tente novamente.' },
			{ status: 500 }
		);
	}
} 