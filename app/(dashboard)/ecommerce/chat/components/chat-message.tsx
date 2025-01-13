'use client';

import { cn } from '@/lib/utils';
import { Message } from 'ai';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export interface ChatMessageProps {
	message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
	return (
		<div className="flex flex-col gap-2">
			<ReactMarkdown
				className={cn(
					'prose break-words prose-p:leading-relaxed prose-pre:p-0',
					message.role === 'user'
						? 'prose-invert prose-p:text-white prose-strong:text-white prose-a:text-white'
						: 'dark:prose-invert'
				)}
			>
				{message.content}
			</ReactMarkdown>

			<span className="text-[11px] text-muted-foreground">
				{format(new Date(), 'HH:mm', { locale: ptBR })}
			</span>
		</div>
	);
}
