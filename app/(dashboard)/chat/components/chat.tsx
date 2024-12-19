'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageWithLinks } from '@/app/lib/formatMessage';
import { ChatMessage as IChatMessage } from '@/lib/supabaseService';
import { useSessionManager } from '../hooks/useSessionManager';
import { createChatSession } from '@/lib/supabaseService';

// Constantes
const MAX_CONTEXT_MESSAGES = 8;
const INITIAL_GREETING = `Olá! Sou a assistente virtual da True Source. Posso ajudar você a:

• Buscar informações sobre pedidos
• Verificar status de entregas
• Consultar notas fiscais
• Analisar dados de transportadoras

Como posso ajudar você hoje?`;

// Componente de mensagem individual
const ChatMessageComponent = ({ message }: { message: IChatMessage }) => (
	<div
		key={`${message.session_id}-${message.created_at}-${message.role}`}
		className={cn(
			'chat-message flex w-full items-start gap-2 relative animate-slideIn',
			message.role === 'user' ? 'justify-end' : 'justify-start'
		)}
	>
		{message.role === 'assistant' && (
			<Avatar className="w-8 h-8 mt-1">
				<AvatarImage src="/images/assistant-avatar.png" alt="True Assistant" />
				<AvatarFallback>TA</AvatarFallback>
			</Avatar>
		)}
		<div
			className={cn(
				'chat-message-bubble',
				message.role === 'user' ? 'user' : 'assistant'
			)}
		>
			<div className="chat-message-text whitespace-pre-wrap break-words">
				{formatMessageWithLinks(message.content)}
			</div>
			<span className="chat-timestamp">
				{new Date(message.created_at!).toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				})}
			</span>
		</div>
	</div>
);

// Componente de indicador de digitação
const TypingIndicator = () => (
	<div className="chat-message flex w-full items-start gap-2 justify-start animate-slideIn">
		<Avatar className="w-8 h-8 mt-1">
			<AvatarImage src="/images/assistant-avatar.png" alt="True Assistant" />
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
);

// Componente de cabeçalho do chat
const ChatHeader = ({ isLoading }: { isLoading: boolean }) => (
	<div className="chat-header">
		<Avatar className="w-10 h-10">
			<AvatarImage src="/images/assistant-avatar.png" alt="True Assistant" />
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
);

interface ChatComponentProps {
	userId: string;
}

export function ChatComponent({ userId }: ChatComponentProps) {
	const { generateSessionId } = useSessionManager(userId);
	const [sessionId, setSessionId] = useState(() => generateSessionId());
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [initializationAttempts, setInitializationAttempts] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const welcomeMessageSent = useRef(false);
	const { theme } = useTheme();

	// Efeito para inicializar sessão
	useEffect(() => {
		const initializeSession = async () => {
			if (initializationAttempts >= 2) {
				setError('Não foi possível inicializar o chat. Por favor, recarregue a página.');
				setMessages([{
					role: 'assistant',
					content: 'Desculpe, estamos tendo problemas técnicos. Por favor, tente novamente mais tarde.',
					session_id: 'error-session',
					created_at: new Date().toISOString(),
				}]);
				return;
			}

			try {
				setIsLoading(true);
				setError(null);
				
				const newSessionId = generateSessionId();
				console.log('Tentando criar sessão com ID:', newSessionId);
				
				await createChatSession(newSessionId, userId);
				console.log('Sessão criada com sucesso');
				
				setSessionId(newSessionId);
				
				// Adiciona mensagem de boas-vindas
				setMessages([{
					role: 'assistant',
					content: INITIAL_GREETING,
					session_id: newSessionId,
					created_at: new Date().toISOString(),
				}]);
				
				welcomeMessageSent.current = true;
				
			} catch (err) {
				console.error('Erro ao inicializar sessão:', err);
				setInitializationAttempts(prev => prev + 1);
				// Tentar novamente após 2 segundos
				setTimeout(() => initializeSession(), 2000);
			} finally {
				setIsLoading(false);
			}
		};

		if (!welcomeMessageSent.current) {
			initializeSession();
		}
	}, [userId, generateSessionId, initializationAttempts]);

	// Scroll para a última mensagem
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// Função para enviar mensagem
	const sendMessage = async (content: string) => {
		try {
			setIsLoading(true);

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization:
						document.cookie
							.split('; ')
							.find((row) => row.startsWith('__session='))
							?.split('=')[1] || '',
				},
				body: JSON.stringify({
					messages: messages.slice(-MAX_CONTEXT_MESSAGES),
					content,
					sessionId,
					userId,
					isNewSession: false,
				}),
			});

			if (!response.ok) {
				throw new Error('Erro ao enviar mensagem');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let assistantMessage = '';

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value);
					assistantMessage += chunk;

					// Atualiza a mensagem em tempo real
					setMessages((prev) => {
						const lastMessage = prev[prev.length - 1];
						if (lastMessage?.role === 'assistant') {
							return [
								...prev.slice(0, -1),
								{ ...lastMessage, content: assistantMessage },
							];
						}
						return [
							...prev,
							{
								role: 'assistant',
								content: assistantMessage,
								session_id: sessionId,
								created_at: new Date().toISOString(),
							},
						];
					});
				}
			}
		} catch (error) {
			console.error('Erro ao processar mensagem:', error);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content:
						'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
					session_id: sessionId,
					created_at: new Date().toISOString(),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	// Handler do formulário
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage: IChatMessage = {
			role: 'user',
			content: input.trim(),
			session_id: sessionId,
			created_at: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		await sendMessage(userMessage.content);
	};

	return (
		<Card className="chat-card h-full">
			<ChatHeader isLoading={isLoading} />

			<div className="messages-container flex-1 overflow-hidden">
				<ScrollArea className="h-full">
					{error ? (
						<div className="p-4 text-center text-red-500">{error}</div>
					) : (
						<div className="space-y-4 p-4">
							{messages.map((message, index) => (
								<ChatMessageComponent
									key={`${message.session_id}-${message.created_at}-${index}`}
									message={message}
								/>
							))}
							{isLoading && <TypingIndicator />}
							<div ref={messagesEndRef} />
						</div>
					)}
				</ScrollArea>
			</div>

			<form onSubmit={handleSubmit} className="chat-input-container p-4 border-t">
				<div className="flex gap-3 items-center max-w-5xl mx-auto">
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Digite sua mensagem..."
						className="flex-1 rounded-full bg-background/50"
						disabled={!!error || isLoading}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e);
							}
						}}
					/>
					<Button
						type="submit"
						disabled={!input.trim() || isLoading || !!error}
						size="icon"
						className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
					>
						<Send className="h-5 w-5" />
					</Button>
				</div>
			</form>
		</Card>
	);
}
