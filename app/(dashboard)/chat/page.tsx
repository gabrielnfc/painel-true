'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	pending?: boolean;
	timestamp?: string;
}

interface QueuedMessage {
	content: string;
	timestamp: number;
}

export default function ChatPage() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialGreeting, setIsInitialGreeting] = useState(true);
	const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const { theme } = useTheme();
	const processingRef = useRef(false);

	// Efeito para adicionar a mensagem de saudação com delay
	useEffect(() => {
		if (messages.length === 0) {
			setIsLoading(true);

			setTimeout(() => {
				setMessages([
					{
						role: 'assistant',
						content:
							'Olá! Sou a assistente virtual da True Source. Posso ajudar você a:\n\n' +
							'• Buscar informações sobre pedidos\n' +
							'• Verificar status de entregas\n' +
							'• Consultar notas fiscais\n' +
							'• Analisar dados de transportadoras\n\n' +
							'Como posso ajudar você hoje?',
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
					},
				]);
				setIsLoading(false);
				setIsInitialGreeting(false);
			}, 3000);
		}
	}, []);

	// Processador de fila de mensagens otimizado
	useEffect(() => {
		const processQueue = async () => {
			if (messageQueue.length === 0 || processingRef.current) return;

			processingRef.current = true;
			const nextMessage = messageQueue[0];

			const newUserMessage = {
				role: 'user' as const,
				content: nextMessage.content,
				timestamp: new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit',
				}),
			};

			setMessages((prev) => [...prev, newUserMessage]);
			setIsLoading(true);

			try {
				await new Promise((resolve) => setTimeout(resolve, 3000));

				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						messages: [...messages, newUserMessage],
					}),
				});

				if (!response.ok) throw new Error('Falha ao obter resposta');

				const data = await response.json();
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						content: data.message,
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
					},
				]);
			} catch (error) {
				console.error('Erro ao processar mensagem:', error);
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						content: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
						timestamp: new Date().toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						}),
					},
				]);
			} finally {
				setIsLoading(false);
				setMessageQueue((prev) => prev.slice(1));
				processingRef.current = false;
			}
		};

		processQueue();
	}, [messageQueue, messages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMessage = input.trim();
		setInput('');
		setMessageQueue((prev) => [
			...prev,
			{ content: userMessage, timestamp: Date.now() },
		]);
	};

	// Scroll to bottom effect
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	return (
		<div className="container mx-auto max-w-4xl p-4">
			<Card className="flex flex-col h-[calc(100vh-8rem)]">
				{/* Chat Header */}
				<div className="border-b px-4 py-3 flex items-center gap-3">
					<div className="relative w-10 h-10 rounded-full overflow-hidden">
						<Image
							src="/images/assistant-avatar.png"
							alt="True Assistant"
							fill
							className="object-cover"
						/>
					</div>
					<div>
						<h1 className="font-semibold">Assistente True Source</h1>
						<p className="text-xs text-muted-foreground">
							{isLoading ? 'Digitando...' : 'Online'}
						</p>
					</div>
				</div>

				{/* Messages Container */}
				<div
					ref={chatContainerRef}
					className={cn(
						'flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 relative',
						theme === 'light' ? 'bg-[#FEFAE0]' : 'bg-background'
					)}
				>
					{/* Background Pattern */}
					<div
						className="absolute inset-0 overflow-hidden pointer-events-none"
						style={{
							backgroundImage:
								theme === 'light'
									? `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`
									: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
							backgroundSize: '24px 24px',
							backgroundRepeat: 'repeat',
							opacity: theme === 'light' ? 0.03 : 0.05,
						}}
					/>

					{/* Messages */}
					<div className="relative z-10 space-y-4">
						{messages.map((message, index) => (
							<div
								key={index}
								className={cn(
									'flex w-full items-end gap-2',
									message.role === 'user' ? 'justify-end' : 'justify-start'
								)}
							>
								{message.role === 'assistant' && (
									<div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
										<Image
											src="/images/assistant-avatar.png"
											alt="True Assistant"
											fill
											className="object-cover"
										/>
									</div>
								)}
								<div
									className={cn(
										'rounded-lg px-4 py-2 max-w-[80%] shadow-sm',
										message.role === 'user'
											? 'bg-primary text-primary-foreground rounded-tr-none'
											: 'bg-muted rounded-tl-none'
									)}
								>
									<p className="whitespace-pre-wrap break-words">
										{message.content}
									</p>
									<span className="text-[10px] text-muted-foreground text-right block mt-1">
										{message.timestamp}
									</span>
								</div>
							</div>
						))}

						{isLoading && (
							<div className="flex w-full items-end gap-2 justify-start">
								<div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
									<Image
										src="/images/assistant-avatar.png"
										alt="True Assistant"
										fill
										className="object-cover"
									/>
								</div>
								<div className="bg-muted rounded-lg rounded-tl-none px-4 py-2 shadow-sm">
									<div className="flex gap-1">
										<div className="w-2 h-2 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.3s]" />
										<div className="w-2 h-2 rounded-full bg-foreground/20 animate-bounce [animation-delay:-0.15s]" />
										<div className="w-2 h-2 rounded-full bg-foreground/20 animate-bounce" />
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				</div>

				{/* Input Form */}
				<form
					onSubmit={handleSubmit}
					className="border-t p-4 flex gap-2 items-center"
				>
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Digite uma mensagem"
						disabled={isInitialGreeting}
						className="flex-1 rounded-full"
					/>
					<Button
						type="submit"
						disabled={isInitialGreeting || !input.trim()}
						size="icon"
						className="rounded-full h-10 w-10"
					>
						<Send className="h-5 w-5" />
					</Button>
				</form>
			</Card>
		</div>
	);
}
