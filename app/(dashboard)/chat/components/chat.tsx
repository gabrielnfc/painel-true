'use client';

import { useChat, Message } from 'ai/react';
import { cn } from '@/lib/utils';
import { ChatMessage } from './ChatMessage';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';

const WELCOME_MESSAGE = {
	id: 'welcome',
	role: 'assistant' as const,
	content: `Olá! Bem-vindo ao True Assistant. Estou aqui para ajudar com informações sobre pedidos.
🔍 ID do Pedido: Utilize o ID único do pedido para a busca (exemplo: 924611244).
🔍 Número do Pedido: Utilize o número sequencial do pedido (exemplo: 176675).
🔍 ID da Nota Fiscal: Utilize o ID único da nota fiscal associada ao pedido (exemplo: 924611536).
🔍 Número da Ordem de Compra: Utilize o número da ordem de compra relacionada ao pedido (exemplo: 1480400978404-01).
Por favor, forneça um dos números acima para começar.`,
};

export interface ChatProps extends React.ComponentProps<'div'> {
	initialMessages?: Message[];
	id?: string;
}

export function Chat({ id, initialMessages = [], className }: ChatProps) {
	const [previewToken, setPreviewToken] = useLocalStorage<string | null>(
		'ai-token',
		null
	);
	const [previewTokenDialog, setPreviewTokenDialog] = useState(false);
	const [previewTokenError, setPreviewTokenError] = useState<string | null>(
		null
	);
	const [isInitializing, setIsInitializing] = useState(true);

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	const {
		messages,
		append,
		reload,
		stop,
		isLoading,
		input,
		setInput,
		handleInputChange,
		handleSubmit,
	} = useChat({
		initialMessages: [WELCOME_MESSAGE],
		id,
		body: {
			id,
			previewToken,
		},
		onResponse(response) {
			if (response.status === 401) {
				setPreviewTokenDialog(true);
				return;
			}
			if (!response.ok) {
				toast.error('Erro ao processar mensagem. Por favor, tente novamente.');
				return;
			}
		},
		onFinish() {
			if (!document.startViewTransition) {
				return;
			}

			document.startViewTransition(() => {
				const messages = document.getElementById('messages');
				const lastMessage = messages?.lastElementChild;
				lastMessage?.scrollIntoView({ behavior: 'smooth' });
			});
		},
	});

	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	useEffect(() => {
		setTimeout(() => {
			setIsInitializing(false);
		}, 1500);
	}, []);

	useEffect(() => {
		if (!isInitializing && messages.length === 0) {
			setTimeout(() => {
				append(WELCOME_MESSAGE);
			}, 1000);
		}
	}, [isInitializing, messages.length, append]);

	return (
		<div className="chat-container">
			<div className="chat-header">
				<div className="chat-header-info">
					<Image
						src="/images/assistant-avatar.png"
						alt="True Source Assistant"
						width={32}
						height={32}
						className="chat-avatar"
						priority
					/>
					<div>
						<h3 className="chat-header-title">True Source Assistant</h3>
						<p className="chat-header-status">Online</p>
					</div>
				</div>
			</div>

			<div className="chat-messages" id="messages">
				{messages.map((message, i) => (
					<ChatMessage key={message.id || i} message={message} />
				))}
				{isLoading && (
					<div className="chat-message assistant">
						<div className="shrink-0">
							<Image
								src="/images/assistant-avatar.png"
								alt="True Source Assistant"
								width={32}
								height={32}
								className="chat-avatar"
								priority
							/>
						</div>
						<div className="chat-typing">
							<div className="typing-dot [animation-delay:-0.3s]" />
							<div className="typing-dot [animation-delay:-0.15s]" />
							<div className="typing-dot" />
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			<div className="chat-input-container">
				<form onSubmit={handleSubmit}>
					<div className="chat-input-wrapper">
						<input
							type="text"
							value={input}
							onChange={handleInputChange}
							placeholder="Digite sua mensagem..."
							className="chat-input"
						/>
						<button
							type="submit"
							title="Enviar mensagem"
							aria-label="Enviar mensagem"
							disabled={isLoading || !input.trim()}
							className="chat-send-button"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-4 w-4"
							>
								<path d="m3 3 3 9-3 9 19-9Z" />
								<path d="M6 12h16" />
							</svg>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
