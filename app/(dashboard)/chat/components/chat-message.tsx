'use client';

import { Message } from 'ai';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';
import { IconUser, IconBot } from './icons';

export interface ChatMessageProps {
	message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
	return (
		<div className={cn('group relative mb-4 flex items-start md:-ml-12')}>
			<div
				className={cn(
					'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
					message.role === 'user'
						? 'bg-background'
						: 'bg-primary text-primary-foreground'
				)}
			>
				{message.role === 'user' ? <IconUser /> : <IconBot />}
			</div>
			<div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
				<Markdown className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
					{message.content}
				</Markdown>
			</div>
		</div>
	);
}
