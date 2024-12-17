import { OpenAI } from 'openai';
import { bigQueryService } from '@/lib/bigquery';
import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/prompts/system-prompt';

interface ClienteInfo {
	nome?: string;
	cpf_cnpj?: string;
	email?: string;
	fone?: string;
}

// Função para verificar variáveis de ambiente necessárias
function checkRequiredEnvVars() {
	const required = {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
		GOOGLE_CLOUD_CLIENT_EMAIL: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
		GOOGLE_CLOUD_PRIVATE_KEY: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
	};

	const missing = Object.entries(required)
		.filter(([_, value]) => !value)
		.map(([key]) => key);

	if (missing.length > 0) {
		throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
	}

	// Validação específica para a API key do OpenAI
	if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
		throw new Error('Invalid OpenAI API key format');
	}

	// Log environment variables status (without exposing sensitive data)
	console.log('Environment variables check:', {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Presente e no formato correto' : 'Ausente ou formato inválido',
		GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
		GOOGLE_CLOUD_CLIENT_EMAIL: !!process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
		GOOGLE_CLOUD_PRIVATE_KEY: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
	});
}

// Função para inicializar o cliente OpenAI com validação
async function initializeOpenAI() {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error('OpenAI API key is missing');
	}

	try {
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		// Teste de conexão simples com GPT-4 Turbo
		await openai.chat.completions.create({
			model: 'gpt-4-0125-preview',
			messages: [{ role: 'system', content: 'Test connection' }],
			max_tokens: 5,
		});

		console.log('Conexão com OpenAI testada com sucesso');
		return openai;
	} catch (error: any) {
		console.error('Erro ao inicializar OpenAI:', {
			error: error.message,
			status: error.response?.status,
			data: error.response?.data
		});
		
		if (error.response?.status === 401) {
			throw new Error('OpenAI API key inválida');
		} else if (error.response?.status === 429) {
			throw new Error('Limite de requisições OpenAI excedido');
		} else if (error.response?.status === 500) {
			throw new Error('Erro interno do servidor OpenAI');
		} else if (error.message?.includes('model')) {
			console.error('Erro com o modelo GPT-4:', error);
			throw new Error('Modelo GPT-4 não disponível para esta API key');
		}
		throw error;
	}
}

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
	let clienteInfo: ClienteInfo = {};
	try {
		clienteInfo = JSON.parse(order.cliente_json || '{}') as ClienteInfo;
	} catch (e) {
		console.error('Erro ao fazer parse do cliente_json:', e);
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
	console.log('Iniciando processamento da requisição POST /api/chat');
	
	try {
		// Verifica todas as variáveis de ambiente necessárias
		try {
			checkRequiredEnvVars();
		} catch (error: any) {
			console.error('Erro na verificação das variáveis de ambiente:', error);
			return NextResponse.json(
				{ message: '❌ Erro de configuração do servidor: ' + error.message },
				{ status: 500 }
			);
		}

		const { messages } = await req.json();
		const lastMessage = messages[messages.length - 1].content;
		console.log('Última mensagem recebida:', lastMessage);
		
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

		console.log('Resultado da análise da mensagem:', {
			orderMatch: orderMatch?.[0],
			isOrderNumberSearch
		});

		// Se a mensagem contém um número que parece ser um pedido
		if (orderMatch) {
			try {
				// Se não for busca por número de ordem de compra, remove o hífen
				const searchValue = isOrderNumberSearch 
					? orderMatch[0] 
					: orderMatch[0].replace(/-/g, '');
				
				console.log('Iniciando busca no BigQuery com valor:', searchValue);

				// Aguarda explicitamente a resposta do BigQuery
				const results = await bigQueryService.searchOrder(searchValue);
				console.log('Resultados do BigQuery:', {
					found: !!results,
					count: results?.length || 0
				});

				if (results && results.length > 0) {
					// Initialize OpenAI client com validação
					const openai = await initializeOpenAI();

					// Formata os dados do pedido
					const formattedOrderData = formatOrderData(results[0]);
					console.log('Dados do pedido formatados com sucesso');

					const completion = await openai.chat.completions.create({
						model: 'gpt-4-0125-preview',
						messages: [
							{
								role: 'system',
								content: systemPrompt + `\n\nIMPORTANTE: Você deve usar APENAS as informações fornecidas abaixo e manter o formato com os ícones conforme especificado acima. NUNCA invente ou suponha informações que não estejam presentes nos dados.\n\n${formattedOrderData}`,
							},
							...messages,
						],
						temperature: 0.3,
						max_tokens: 1000,
					});

					console.log('Resposta do OpenAI gerada com sucesso');

					return NextResponse.json({
						message: completion.choices[0].message.content,
					});
				} else {
					console.log('Nenhum resultado encontrado no BigQuery');
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
			} catch (error: any) {
				console.error('Erro detalhado na busca do pedido:', error);

				// Erro específico para problemas com OpenAI
				if (error.message?.includes('OpenAI')) {
					console.error('Erro específico do OpenAI:', error);
					return NextResponse.json({
						message: '❌ Erro ao processar a resposta. Por favor, contate o administrador do sistema.'
					});
				}

				// Erro específico para problemas de autenticação do BigQuery
				if (error.message?.includes('credentials') || error.message?.includes('authentication')) {
					console.error('Erro de autenticação do BigQuery:', error);
					return NextResponse.json(
						{ message: '❌ Erro de autenticação ao acessar os dados. Por favor, contate o administrador do sistema.' },
						{ status: 401 }
					);
				}

				// Erro de timeout
				if (error.message?.includes('timeout')) {
					console.error('Erro de timeout na busca:', error);
					return NextResponse.json({
						message: '⚠️ A busca está demorando mais que o esperado. Por favor, tente novamente em alguns instantes.'
					});
				}

				// Erro genérico com mais detalhes
				return NextResponse.json({
					message: '❌ Ocorreu um erro ao buscar as informações do pedido. Detalhes técnicos foram registrados para análise.'
				});
			}
		} else {
			console.log('Mensagem não contém número de pedido, processando com OpenAI');
			try {
				// Initialize OpenAI client com validação
				const openai = await initializeOpenAI();

				const completion = await openai.chat.completions.create({
					model: 'gpt-4-0125-preview',
					messages: [
						{
							role: 'system',
							content: systemPrompt + '\n\nIMPORTANTE: Você deve responder APENAS com base nas informações que você tem certeza. NUNCA invente ou suponha informações sobre pedidos. Se o usuário perguntar sobre um pedido específico, peça o número do pedido.',
						},
						...messages,
					],
					temperature: 0.3,
					max_tokens: 1000,
				});

				console.log('Resposta do OpenAI gerada com sucesso para mensagem sem número de pedido');

				return NextResponse.json({
					message: completion.choices[0].message.content,
				});
			} catch (error: any) {
				console.error('Erro ao processar mensagem com OpenAI:', error);
				return NextResponse.json({
					message: '❌ Erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.'
				});
			}
		}
	} catch (error: any) {
		console.error('Erro não tratado na rota /api/chat:', error);
		
		// Verifica se é um erro de timeout
		if (error.message?.includes('timeout')) {
			return NextResponse.json({
				message: '⚠️ A operação demorou muito para responder. Por favor, tente novamente em alguns instantes.'
			});
		}

		// Erro genérico com logging aprimorado
		return NextResponse.json({
			message: '❌ Desculpe, ocorreu um erro inesperado. Nossa equipe técnica foi notificada e está investigando o problema.'
		});
	}
} 