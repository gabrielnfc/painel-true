'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageWithLinks } from '@/app/lib/formatMessage';

// Constantes
const MAX_CONTEXT_MESSAGES = 8;
const INITIAL_GREETING = `Olá! Sou a assistente virtual da True Source. Posso ajudar você a:

• Buscar informações sobre pedidos
• Verificar status de entregas
• Consultar notas fiscais
• Analisar dados de transportadoras

Como posso ajudar você hoje?`;

// Tipos
interface Message {
	role: 'user' | 'assistant' | 'system';
	content: string;
	pending?: boolean;
	timestamp?: string;
	orderData?: any; // Dados do pedido armazenados na mensagem
}

interface QueuedMessage {
	content: string;
	timestamp: number;
}

// Componente de mensagem individual (memoizado)
const ChatMessage = React.memo(({ message }: { message: Message }) => (
	<div className={cn(
		'chat-message flex w-full items-start gap-2 relative animate-slideIn',
		message.role === 'user' ? 'justify-end' : 'justify-start'
	)}>
		{message.role === 'assistant' && (
			<Avatar className="w-8 h-8 mt-1 transition-transform hover:scale-105">
				<AvatarImage
					src="/images/assistant-avatar.png"
					alt="True Assistant"
					className="w-8 h-8"
				/>
				<AvatarFallback>TA</AvatarFallback>
			</Avatar>
		)}
		<div className={cn(
			'chat-message-bubble',
			message.role === 'user' ? 'user' : 'assistant'
		)}>
			<div className="chat-message-text whitespace-pre-wrap break-words">
				{formatMessageWithLinks(message.content)}
			</div>
			<span className="chat-timestamp">
				{message.timestamp}
			</span>
		</div>
	</div>
));

ChatMessage.displayName = 'ChatMessage';

// Componente de indicador de digitação (memoizado)
const TypingIndicator = React.memo(() => (
	<div className="chat-message flex w-full items-start gap-2 justify-start animate-slideIn">
		<Avatar className="w-8 h-8 mt-1">
			<AvatarImage
				src="/images/assistant-avatar.png"
				alt="True Assistant"
				className="w-8 h-8"
			/>
			<AvatarFallback>TA</AvatarFallback>
		</Avatar>
		<div className="chat-message-bubble assistant">
			<div className="typing-indicator">
				<div className="typing-dot"></div>
				<div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
				<div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
			</div>
		</div>
	</div>
));

TypingIndicator.displayName = 'TypingIndicator';

// Componente de cabeçalho do chat (memoizado)
const ChatHeader = React.memo(({ isLoading }: { isLoading: boolean }) => (
	<div className="chat-header">
		<Avatar className="transition-transform hover:scale-105 w-10 h-10">
			<AvatarImage
				src="/images/assistant-avatar.png"
				alt="True Assistant"
			/>
			<AvatarFallback>TA</AvatarFallback>
		</Avatar>
		<div className="flex-1">
			<h1 className="chat-title">Assistente True Source</h1>
			<div className="chat-status">
				{isLoading ? (
					<>
						<span className="status-dot typing"></span>
						<span className="chat-subtitle">Digitando...</span>
					</>
				) : (
					<>
						<span className="status-dot online"></span>
						<span className="chat-subtitle">Online</span>
					</>
				)}
			</div>
		</div>
	</div>
));

ChatHeader.displayName = 'ChatHeader';

// Componente principal do chat
export default function ChatPage() {
	// Estados
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialGreeting, setIsInitialGreeting] = useState(true);
	const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
	const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);
	const [currentOrderData, setCurrentOrderData] = useState<any>(null);

	// Refs
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const processingRef = useRef(false);

	// Hooks
	const { theme } = useTheme();

	// Funções memoizadas
	const getContextMessages = useCallback((msgs: Message[]) => {
		const lastMessages = msgs.slice(-MAX_CONTEXT_MESSAGES);
		
		if (msgs.length > MAX_CONTEXT_MESSAGES) {
			return [
				{
					role: 'system' as const,
					content: 'Continuando a conversa anterior sobre consulta de pedidos...',
				},
				...lastMessages,
			];
		}
		
		return lastMessages;
	}, []);

	const handleSubmit = useCallback((e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage = input.trim();
		setInput('');
		setMessageQueue((prev) => [
			...prev,
			{ content: userMessage, timestamp: Date.now() },
		]);
	}, [input]);

	// Efeito para scroll automático
	useEffect(() => {
		if (!messagesEndRef.current) return;
		
		const timeoutId = setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}, 100);

		return () => clearTimeout(timeoutId);
	}, [messages]);

	// Efeito para limpar histórico
	useEffect(() => {
		if (messages.length > MAX_CONTEXT_MESSAGES * 2) {
			const keepMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
			setMessages(keepMessages);
		}
	}, [messages]);

	// Efeito para mensagem inicial
	useEffect(() => {
		if (messages.length === 0) {
			setIsLoading(true);

			const timeoutId = setTimeout(() => {
				setMessages([
					{
						role: 'assistant',
						content: INITIAL_GREETING,
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
					},
				]);
				setIsLoading(false);
				setIsInitialGreeting(false);
				if (inputRef.current) {
					inputRef.current.focus();
				}
			}, 1000);

			return () => clearTimeout(timeoutId);
		}
	}, []);

	// Função para adicionar delay natural
	const addMessageWithDelay = async (message: Message) => {
		setIsLoading(true);
		await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 1000)); // Delay entre 1-1.5s
		setMessages(prev => [...prev, message]);
		setIsLoading(false);
	};

	// Processador de fila de mensagens otimizado
	useEffect(() => {
		if (messageQueue.length === 0) return;

		const processQueue = async () => {
			if (processingRef.current) return;
			processingRef.current = true;

			const nextMessage = messageQueue[0];

			// Adiciona a mensagem do usuário imediatamente
			const newUserMessage = {
				role: 'user' as const,
				content: nextMessage.content,
				timestamp: new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				}),
			};
			setMessages(prev => [...prev, newUserMessage]);

			// Verifica se é uma consulta de pedido
			const orderMatch = nextMessage.content.match(/\d{5,10}/);
			const isOrderRelatedQuestion = /pedido|consultar?|buscar?|procurar?|encontrar?|status|data|intervalo|prazo|entrega|faturamento|expedição|valor|nota|fiscal|dias|entre|quantos|forma de envio/i.test(nextMessage.content);

			try {
				// Se é uma pergunta relacionada a pedido
				if (isOrderRelatedQuestion) {
					// Se encontrou um novo número de pedido, limpa dados anteriores e busca no BigQuery
					if (orderMatch) {
						// Limpa os dados do pedido anterior
						setLastOrderNumber(null);
						setCurrentOrderData(null);
						setMessages(prev => prev.filter(msg => !msg.orderData)); // Remove mensagens com dados do pedido anterior

						// Atualiza com o novo número
						setLastOrderNumber(orderMatch[0]);
						await new Promise(resolve => setTimeout(resolve, 1500));
						const searchingMessage = {
							role: 'assistant' as const,
							content: 'Estou buscando as informações do pedido no banco de dados. Por favor, aguarde um momento...',
							timestamp: new Date().toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							}),
						};
						await addMessageWithDelay(searchingMessage);
					} 
					// Se não tem número novo mas é pergunta sobre pedido
					else if (currentOrderData) {
						// Usa os dados armazenados para responder
						const response = analyzeOrderQuestion(nextMessage.content, currentOrderData);
						const assistantMessage = {
							role: 'assistant' as const,
							content: response,
							timestamp: new Date().toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							}),
							orderData: currentOrderData
						};
						await addMessageWithDelay(assistantMessage);
						setMessageQueue(prev => prev.slice(1));
						processingRef.current = false;
						return;
					}
					// Se não tem número novo nem dados atuais
					else {
						const noOrderMessage = {
							role: 'assistant' as const,
							content: 'Por favor, forneça um número de pedido para que eu possa ajudar você (6 dígitos).',
							timestamp: new Date().toLocaleTimeString([], {
								hour: '2-digit',
								minute: '2-digit',
							}),
						};
						await addMessageWithDelay(noOrderMessage);
						setMessageQueue(prev => prev.slice(1));
						processingRef.current = false;
						return;
					}
				}

				const contextMessages = getContextMessages([...messages, newUserMessage]);
				
				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						messages: contextMessages,
						lastOrderNumber,
						isOrderRelatedQuestion,
						isNewOrderQuery: !!orderMatch,
						currentOrderData
					}),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (data.error) {
					throw new Error(data.error);
				}

				if (!data.message) {
					throw new Error('Resposta sem mensagem');
				}

				// Se recebeu dados de um novo pedido, armazena
				if (data.orderData) {
					setCurrentOrderData(data.orderData);
				}

				const assistantMessage = {
					role: 'assistant' as const,
					content: data.message,
					timestamp: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
					orderData: data.orderData // Armazena os dados do pedido na mensagem
				};

				// Adiciona a resposta com delay natural
				await addMessageWithDelay(assistantMessage);
				setMessageQueue(prev => prev.slice(1));

			} catch (err: unknown) {
				console.error('Erro ao processar mensagem:', err);
				const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
				const errorResponse = {
					role: 'assistant' as const,
					content: `Desculpe, ocorreu um erro ao processar sua mensagem: ${errorMessage}. Por favor, tente novamente.`,
					timestamp: new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					}),
				};

				await addMessageWithDelay(errorResponse);
				setMessageQueue(prev => prev.slice(1));
			} finally {
				setIsLoading(false);
				processingRef.current = false;
			}
		};

		processQueue();
	}, [messageQueue, messages, getContextMessages, lastOrderNumber, currentOrderData]);

	// Renderização otimizada
	const messagesList = useMemo(() => (
		<div className="space-y-4">
			{messages.map((message, index) => (
				<ChatMessage
					key={`${message.role}-${index}-${message.timestamp}`}
					message={message}
				/>
			))}
			{isLoading && <TypingIndicator key="typing-indicator" />}
			<div ref={messagesEndRef} key="messages-end" />
		</div>
	), [messages, isLoading]);

	// Função para analisar perguntas relacionadas a pedidos
	function analyzeOrderQuestion(question: string, orderData: any): string {
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

			// Analisa forma de envio
			if (q.includes('forma de envio')) {
				const formaEnvio = orderData.forma_envio_status ? JSON.parse(orderData.forma_envio_status).nome : 'Não informada';
				return `A forma de envio utilizada é: ${formaEnvio}`;
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

	// Função para formatar a resposta completa do pedido
	function formatOrderResponse(order: any): string {
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
			return `Desculpe, ocorreu um erro ao formatar as informações do pedido. Por favor, tente novamente.\nDetalhes do erro: ${errorMessage}`;
		}
	}

	return (
		<div className="container mx-auto max-w-4xl h-[calc(100vh-2rem)] p-4">
			<Card className="chat-card">
				<ChatHeader isLoading={isLoading} />

				<div className="messages-container">
					<ScrollArea className="messages-scroll-area scrollbar-custom">
						{messagesList}
					</ScrollArea>
				</div>

				<form onSubmit={handleSubmit} className="chat-input-container">
					<div className="flex gap-3 items-center max-w-4xl mx-auto w-full">
						<Input
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Digite sua mensagem..."
							disabled={isInitialGreeting}
							className="flex-1 rounded-full bg-background/50 focus-visible:ring-primary/20 transition-all"
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleSubmit(e);
								}
							}}
						/>
						<Button
							type="submit"
							disabled={isInitialGreeting || !input.trim()}
							size="icon"
							className="rounded-full h-10 w-10 transition-all hover:scale-105 disabled:opacity-50"
						>
							<Send className="h-5 w-5" />
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}

