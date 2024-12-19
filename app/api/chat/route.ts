import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { systemPrompt } from '@/lib/prompts/system-prompt';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { createChatSession } from '@/lib/supabaseService';

type ExtendedChatMessage = ChatCompletionMessageParam & {
	created_at?: string;
	session_id?: string;
};

export const runtime = 'nodejs';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY!
});

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Função para recuperar a sessão do chat
async function getChatSession(sessionId: string) {
	try {
		// Buscar a sessão
		const { data: session } = await supabase
			.from('chat_sessions')
			.select('*')
			.eq('id', sessionId)
			.single();

		if (!session) return null;

		// Verificar se a sessão não expirou (1 hora)
		const lastActivity = new Date(session.last_activity);
		const now = new Date();
		const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

		if (hoursDiff > 1) {
			// Sessão expirada, deletar
			await supabase.from('chat_sessions').delete().eq('id', sessionId);
			await supabase.from('chat_messages').delete().eq('session_id', sessionId);
			return null;
		}

		// Buscar mensagens da sessão
		const { data: messages } = await supabase
			.from('chat_messages')
			.select('*')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: true });

		return {
			session,
			messages: messages || []
		};
	} catch (error) {
		console.error('Error getting chat session:', error);
		return null;
	}
}

// Função para salvar a sessão no Supabase
async function saveSessionToSupabase(sessionData: any) {
	try {
		const { messages, orderContext } = sessionData;
		
		// Obter ID do usuário do Clerk
		const { userId } = auth();
		
		// Verificar se o usuário está autenticado
		if (!userId) {
			throw new Error('Usuário não autenticado');
		}

		const sessionId = messages[0]?.session_id || crypto.randomUUID();
		
		// Primeiro, buscar todas as sessões antigas do usuário
		const { data: oldSessions } = await supabase
			.from('chat_sessions')
			.select('id')
			.eq('user_id', userId);

		if (oldSessions && oldSessions.length > 0) {
			const sessionIds = oldSessions.map(session => session.id);
			
			// Deletar todas as mensagens antigas
			await supabase
				.from('chat_messages')
				.delete()
				.in('session_id', sessionIds);
			
			// Deletar todas as sessões antigas
			await supabase
				.from('chat_sessions')
				.delete()
				.in('id', sessionIds);
		}

		// Criar nova sessão
		const { error: sessionError } = await supabase
			.from('chat_sessions')
			.insert({
				id: sessionId,
				user_id: userId,
				last_activity: new Date().toISOString()
			});

		if (sessionError) {
			console.error('Error saving chat session:', sessionError);
			return;
		}

		// Salvar apenas as mensagens da sessão atual
		const messagesToSave = messages.map((msg: ExtendedChatMessage) => ({
			session_id: sessionId,
			role: msg.role,
			content: (msg.content || '').slice(0, 1500),
			order_data: msg.role === 'system' && orderContext ? 
				JSON.stringify(orderContext).slice(0, 1500) : null,
			created_at: msg.created_at || new Date().toISOString()
		}));

		const { error: messageError } = await supabase
			.from('chat_messages')
			.insert(messagesToSave);

		if (messageError) {
			console.error('Error saving chat messages:', messageError);
		}

		return sessionId;
	} catch (error) {
		console.error('Error in saveSessionToSupabase:', error);
	}
}

// Função auxiliar para formatar a resposta do pedido
async function formatOrderResponse(order: any) {
	try {
		console.log('Dados brutos do pedido:', JSON.stringify(order, null, 2));

		// Validar e processar dados do cliente
		const cliente = typeof order.cliente_json === 'string' ? 
			JSON.parse(order.cliente_json) : order.cliente_json;
		
		if (!cliente) {
			throw new Error('Dados do cliente não disponíveis');
		}

		// Validar e processar itens do pedido
		let itens = [];
		try {
			if (typeof order.itens_pedido === 'string') {
				itens = JSON.parse(order.itens_pedido);
			} else if (Array.isArray(order.itens_pedido)) {
				itens = order.itens_pedido;
			} else {
				throw new Error('Formato de itens inválido');
			}

			console.log('Itens processados:', JSON.stringify(itens, null, 2));
		} catch (e) {
			console.error('Erro ao processar itens do pedido:', e, order.itens_pedido);
			throw new Error('Erro ao processar itens do pedido');
		}
		
		if (!Array.isArray(itens) || itens.length === 0) {
			throw new Error('Itens do pedido não disponíveis');
		}

		// Processar e validar itens
		const formattedItems = itens.map((item: any, index: number) => {
			const campos = Object.entries(item.item).reduce((acc, [key, value]) => {
				acc[key.toLowerCase()] = value;
				return acc;
			}, {} as any);

			const descricao = campos.descricao || campos.nome || campos.produto || 
				campos.descricao_produto || "Nome não disponível";
			
			let quantidade = 0;
			if ('quantidade' in campos) quantidade = Number(campos.quantidade);
			else if ('qtde' in campos) quantidade = Number(campos.qtde);
			else if ('quantidade_pedida' in campos) quantidade = Number(campos.quantidade_pedida);
			
			let valorUnitario = 0;
			if ('valor_unitario' in campos) valorUnitario = Number(campos.valor_unitario);
			else if ('valor' in campos) valorUnitario = Number(campos.valor);
			else if ('preco' in campos) valorUnitario = Number(campos.preco);
			else if ('valor_produto' in campos) valorUnitario = Number(campos.valor_produto);

			const valorFormatado = !isNaN(valorUnitario) ? `R$ ${valorUnitario.toFixed(2)}` : "Preço não disponível";

			return {
				index: index + 1,
				descricao,
				quantidade,
				valor_unitario: valorUnitario,
				valor_formatado: valorFormatado,
				formatted: `${descricao} (${quantidade} unidade${quantidade > 1 ? 's' : ''}) - ${valorFormatado}`
			};
		});

		// Construir o contexto completo
		const contextToSave = {
			...order,
			_formatted_items: formattedItems,
			_formatted_date: order.data_pedido || "Data não disponível",
			_last_query_time: new Date().toISOString()
		};

		// Construir a resposta formatada
		let response = `📦 Pedido #${order.numero_pedido}\n\n`;

		// Datas do Pedido
		response += `📅 Datas\n\n`;
		if (order.data_pedido) response += `- Data do Pedido: ${order.data_pedido}\n`;
		if (order.data_faturamento_status) {
			const dataFaturamento = new Date(order.data_faturamento_status);
			response += `- Data de Faturamento: ${dataFaturamento.toLocaleDateString('pt-BR')}\n`;
		}
		if (order.data_coleta_status) {
			const dataColeta = new Date(order.data_coleta_status);
			response += `- Data de Coleta: ${dataColeta.toLocaleDateString('pt-BR')}\n`;
		}
		if (order.data_entrega) response += `- Data de Entrega: ${order.data_entrega}\n`;
		if (order.data_prevista) response += `- Data Prevista: ${order.data_prevista}\n`;
		response += '\n';

		// Status
		response += `✅ Status: ${order.situacao_pedido || "Status não disponível"}\n\n`;

		// Informações do Cliente
		response += `👤 Informações do Cliente\n\n`;
		response += `- Nome: ${cliente.nome || "Nome não disponível"}\n`;
		response += `- CPF/CNPJ: ${cliente.cpf_cnpj || "CPF/CNPJ não disponível"}\n`;
		response += `- 📧 Email: ${cliente.email || "Email não disponível"}\n`;
		response += `- 📱 Telefone: ${cliente.fone || cliente.celular || "Telefone não disponível"}\n\n`;

		// Endereço de Entrega
		response += `📍 Endereço de Entrega\n\n`;
		response += `- Endereço: ${cliente.endereco || "Endereço não disponível"}\n`;
		response += `- Bairro: ${cliente.bairro || "Bairro não disponível"}\n`;
		response += `- Cidade: ${cliente.cidade || "Cidade não disponível"}\n`;
		response += `- UF: ${cliente.uf || "UF não disponível"}\n`;
		response += `- CEP: ${cliente.cep || "CEP não disponível"}\n\n`;

		// Informações de Entrega
		response += `🚚 Informações de Entrega\n\n`;
		response += `- Transportadora: ${order.nome_transportador || "Transportadora não definida"}\n`;
		response += `- Tipo de Frete: ${order.forma_frete || "Tipo de frete não definido"}\n`;
		response += `- Frete: ${order.frete_por_conta === 'R' ? 'CIF (Remetente)' : 'FOB (Destinatário)'}\n\n`;

		// Informações Financeiras
		response += `💳 Informações Financeiras\n\n`;
		response += `- Valor Total dos Produtos: R$ ${Number(order.total_produtos || 0).toFixed(2)}\n`;
		response += `- Valor Total do Pedido: R$ ${Number(order.total_pedido || 0).toFixed(2)}\n`;
		response += `- Desconto Aplicado: R$ ${Number(order.valor_desconto || 0).toFixed(2)}\n\n`;

		// Nota Fiscal
		response += `📝 Nota Fiscal\n\n`;
		response += `- Número: ${order.numero_nota || "Nota fiscal não emitida"}\n`;
		response += `- Chave de Acesso: ${order.chave_acesso_nota || "Chave de acesso não disponível"}\n\n`;

		// Itens do Pedido
		response += `📦 Itens do Pedido\n\n`;
		formattedItems.forEach((item, index) => {
			response += `${index + 1}. ${item.formatted}\n`;
		});

		return { response, contextToSave };
	} catch (error) {
		console.error('Erro ao formatar resposta do pedido:', error);
		throw error;
	}
}

// Função para limpar histórico do chat
async function cleanupChatHistory(userId: string) {
	try {
		// Primeiro, buscar todas as sessões do usuário
		const { data: sessions } = await supabase
			.from('chat_sessions')
			.select('id')
			.eq('user_id', userId);

		if (sessions && sessions.length > 0) {
			const sessionIds = sessions.map(session => session.id);
			
			// Deletar todas as mensagens das sessões do usuário
			await supabase
				.from('chat_messages')
				.delete()
				.in('session_id', sessionIds);
			
			// Deletar todas as sessões do usuário
			await supabase
				.from('chat_sessions')
				.delete()
				.in('id', sessionIds);
		}
	} catch (error) {
		console.error('Error cleaning up chat history:', error);
	}
}

// Função para buscar pedido
async function searchOrder(searchValue: string) {
	try {
		// Construir a URL base
		let baseUrl;
		if (process.env.NEXT_PUBLIC_APP_URL) {
			baseUrl = process.env.NEXT_PUBLIC_APP_URL;
		} else if (process.env.VERCEL_URL) {
			baseUrl = `https://${process.env.VERCEL_URL}`;
		} else {
			baseUrl = 'http://localhost:3000';
		}

		// Remover qualquer barra no final da URL
		baseUrl = baseUrl.replace(/\/$/, '');

		console.log('Base URL:', baseUrl);
		console.log('Buscando pedido:', searchValue);

		// Obter o token de autenticação do Clerk
		const { getToken } = auth();
		const token = await getToken();

		const response = await fetch(`${baseUrl}/api/orders/search?q=${searchValue}`, {
			method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
		});

		console.log('Status da resposta:', response.status);

		if (!response.ok) {
			console.error('Erro na resposta:', response.statusText);
			throw new Error(`Failed to fetch order: ${response.statusText}`);
		}

		const data = await response.json();
		console.log('Dados recebidos:', data);

		if (!data.results || data.results.length === 0) {
			return null;
		}

		return data.results[0];
	} catch (error) {
		console.error('Error searching order:', error);
		throw error;
	}
}

export async function POST(req: Request) {
	try {
		const { messages, sessionId, userId, isNewSession } = await req.json();

		console.log('Recebida requisição com:', { sessionId, userId, isNewSession });

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(
				JSON.stringify({ error: 'Messages array is required' }),
				{ status: 400 }
			);
		}

		const lastMessage = messages[messages.length - 1];
		if (!lastMessage || !lastMessage.content) {
			return new Response(
				JSON.stringify({ error: 'Invalid message format' }),
				{ status: 400 }
			);
		}

		// Verificar se a mensagem é uma busca de pedido
		const orderNumberMatch = lastMessage.content.match(/pedido\s+(\d+)/i);
		if (orderNumberMatch) {
			try {
				const orderNumber = orderNumberMatch[1];
				const order = await searchOrder(orderNumber);
				
				if (!order) {
					return new Response(
						JSON.stringify({ 
							message: "Desculpe, não encontrei nenhum pedido com esse número. Por favor, verifique se o número está correto e tente novamente." 
						})
					);
				}

				const { response, contextToSave } = await formatOrderResponse(order);

				// Salvar o contexto no Supabase
				if (sessionId) {
					const supabase = createClient(
						process.env.NEXT_PUBLIC_SUPABASE_URL!,
						process.env.SUPABASE_SERVICE_KEY!
					);

					await supabase
						.from('chat_messages')
						.insert({
							session_id: sessionId,
							role: 'assistant',
							content: response,
							context: contextToSave,
						});
				}

				return new Response(JSON.stringify({ message: response }));
			} catch (error) {
				console.error('Error processing order search:', error);
				return new Response(
					JSON.stringify({ 
						message: "Desculpe, ocorreu um erro ao buscar o pedido. Por favor, tente novamente." 
					})
				);
			}
		}

		// Se não for uma busca de pedido, retornar mensagem padrão
		return new Response(
			JSON.stringify({
				message: "Olá! Sou a assistente virtual da True Source. Posso ajudar você a:\n\n" +
						"• Buscar informações sobre pedidos\n" +
						"• Verificar status de entregas\n" +
						"• Consultar notas fiscais\n" +
						"• Analisar dados de transportadoras\n\n" +
						"Como posso ajudar você hoje?"
			})
		);
	} catch (error) {
		console.error('Error in chat route:', error);
		return new Response(
			JSON.stringify({ error: 'Internal server error' }),
			{ status: 500 }
		);
	}
}

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);