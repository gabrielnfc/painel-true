'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WELCOME_MESSAGE = {
	id: 'welcome',
	role: 'assistant' as const,
	content: `👋 Olá! Eu sou o True Assistant, seu assistente virtual.

Estou aqui para ajudar você com:
• Consultas de pedidos
• Informações sobre entregas
• Status de separação
• Dados de notas fiscais
• E muito mais!

Para começar, você pode me perguntar sobre um pedido específico usando o número do pedido, nota fiscal ou ordem de compra.

Como posso ajudar você hoje?`,
};

export default function ChatPage() {
	const { messages, input, handleInputChange, handleSubmit } = useChat({
		initialMessages: [],
		api: '/api/chat',
	});
	const { user } = useUser();
	const [isTyping, setIsTyping] = useState(false);
	const [showWelcome, setShowWelcome] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Simula digitação e envia mensagem de boas-vindas localmente
	useEffect(() => {
		const simulateTyping = async () => {
			if (!showWelcome && messages.length === 0) {
				setIsTyping(true);
				await new Promise((resolve) => setTimeout(resolve, 2000));
				setIsTyping(false);
				setShowWelcome(true);
			}
		};

		simulateTyping();
	}, [messages.length]);

	// Scroll para o final quando houver novas mensagens
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, isTyping]);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (input.trim()) {
			try {
				setIsTyping(true);
				await handleSubmit(e);
			} catch (error) {
				console.error('Erro ao enviar mensagem:', error);
			} finally {
				setIsTyping(false);
			}
		}
	};

	const displayMessages = showWelcome
		? [WELCOME_MESSAGE, ...messages]
		: messages;

	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-2 py-4 sm:px-4">
			<Card className="w-full max-w-[1200px] rounded-lg border-2 bg-background shadow-[0_2px_40px_-12px] shadow-primary/10 dark:border-neutral-800 dark:shadow-white/5">
				<CardHeader className="border-b border-border/50 bg-muted/50 px-3 py-3 dark:border-neutral-800 sm:px-4">
					<CardTitle className="flex items-center gap-3">
						<div className="relative">
							<Avatar className="h-8 w-8 ring-2 ring-primary/10 dark:ring-neutral-800 sm:h-10 sm:w-10">
								<AvatarImage
									src="/images/assistant-avatar.png"
									alt="True Assistant"
									className="object-cover"
								/>
								<AvatarFallback>TA</AvatarFallback>
							</Avatar>
							<div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500 sm:h-3 sm:w-3">
								<div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75" />
							</div>
						</div>
						<div className="flex flex-col">
							<span className="text-sm font-semibold sm:text-base">
								True Assistant
							</span>
							<span className="text-[10px] text-muted-foreground sm:text-xs">
								online
							</span>
						</div>
					</CardTitle>
				</CardHeader>

				<CardContent className="flex flex-col space-y-4 bg-background/50 p-0 dark:bg-background/50">
					<ScrollArea className="h-[calc(100vh-16rem)] w-full">
						<div className="flex flex-col gap-2 px-3 py-4 sm:gap-3 sm:px-4 sm:py-6">
							{displayMessages.length === 0 ? (
								<div className="flex h-[calc(100vh-20rem)] flex-col items-center justify-center gap-2">
									<Bot className="h-8 w-8 text-muted-foreground opacity-0" />
								</div>
							) : (
								displayMessages.map((message, index) => (
									<div
										key={message.id}
										className={cn('flex items-start gap-2 sm:gap-3', {
											'justify-end': message.role === 'user',
											'justify-start': message.role !== 'user',
										})}
									>
										{message.role !== 'user' && (
											<Avatar className="mt-0.5 h-6 w-6 ring-2 ring-primary/10 dark:ring-neutral-800 sm:h-8 sm:w-8">
												<AvatarImage
													src="/images/assistant-avatar.png"
													alt="True Assistant"
													className="object-cover"
												/>
												<AvatarFallback>TA</AvatarFallback>
											</Avatar>
										)}
										<div
											className={cn(
												'relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-md sm:max-w-[75%] sm:px-4 sm:py-3',
												{
													'bg-primary text-primary-foreground shadow-primary/10':
														message.role === 'user',
													'bg-muted shadow-neutral-200/50 dark:shadow-white/5':
														message.role !== 'user',
													'rounded-tl-sm': message.role !== 'user',
													'rounded-tr-sm': message.role === 'user',
												}
											)}
										>
											<ReactMarkdown
												className={cn(
													'prose prose-sm break-words whitespace-pre-wrap',
													message.role === 'user'
														? 'prose-invert prose-p:leading-relaxed prose-pre:p-0'
														: 'dark:prose-invert prose-p:leading-relaxed prose-pre:p-0'
												)}
												remarkPlugins={[remarkGfm]}
												components={{
													a: ({ node, ...props }) => (
														<a
															{...props}
															target="_blank"
															rel="noopener noreferrer"
															className={cn(
																'font-medium underline underline-offset-4',
																message.role === 'user'
																	? 'text-white hover:text-white/80'
																	: 'text-primary hover:text-primary/80'
															)}
														/>
													),
													p: ({ children }) => (
														<p className="mb-2 last:mb-0 whitespace-pre-line">
															{children}
														</p>
													),
													ul: ({ children }) => (
														<ul className="my-2 list-disc pl-4 marker:text-muted-foreground">
															{children}
														</ul>
													),
													li: ({ children }) => (
														<li className="mb-1 last:mb-0">{children}</li>
													),
												}}
											>
												{message.content}
											</ReactMarkdown>
										</div>
										{message.role === 'user' && (
											<Avatar className="mt-0.5 h-6 w-6 ring-2 ring-primary/10 dark:ring-neutral-800 sm:h-8 sm:w-8">
												<AvatarImage
													src={user?.imageUrl}
													alt={user?.fullName || ''}
													className="object-cover"
												/>
												<AvatarFallback>
													{user?.fullName?.[0]?.toUpperCase() || 'U'}
												</AvatarFallback>
											</Avatar>
										)}
									</div>
								))
							)}
							{isTyping && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Bot className="h-3 w-3 animate-pulse sm:h-4 sm:w-4" />
									<span className="text-xs sm:text-sm">
										True Assistant está digitando...
									</span>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					</ScrollArea>
				</CardContent>

				<CardFooter className="border-t border-border/50 bg-muted/50 px-3 py-4 dark:border-neutral-800 sm:px-4">
					<form onSubmit={onSubmit} className="flex w-full items-center gap-3">
						<div className="relative flex-1">
							<Input
								value={input}
								onChange={handleInputChange}
								placeholder="Digite sua mensagem..."
								className="h-11 w-full rounded-full bg-muted px-4 py-2 pl-5 pr-12 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 dark:bg-background dark:shadow-white/5"
							/>
							<Button
								type="submit"
								size="icon"
								variant="ghost"
								className={cn(
									'absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full',
									!input.trim() && 'text-muted-foreground',
									input.trim() &&
										'text-primary hover:text-primary hover:bg-primary/10'
								)}
								disabled={isTyping || !input.trim()}
							>
								<Send className="h-4 w-4" />
								<span className="sr-only">Enviar mensagem</span>
							</Button>
						</div>
					</form>
				</CardFooter>
			</Card>
		</div>
	);
}
