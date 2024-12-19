'use client';

import { Message } from 'ai';
import { cn } from '@/lib/utils';
import { Markdown } from './Markdown';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export interface ChatMessageProps {
	message: Message;
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
	const { user } = useUser();
	const isAssistant = message.role === 'assistant';

	return (
		<div className={cn('chat-message', message.role)} {...props}>
			{isAssistant && (
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
			)}
			<div className={cn('chat-message-bubble')}>
				<Markdown>{message.content}</Markdown>
			</div>
			{!isAssistant && (
				<div className="shrink-0">
					{user?.imageUrl ? (
						<Image
							src={user.imageUrl}
							alt={user.fullName || 'User'}
							width={32}
							height={32}
							className="chat-avatar"
							priority
						/>
					) : (
						<div className="chat-avatar flex items-center justify-center bg-primary/10 dark:bg-primary/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-4 w-4 text-foreground/70"
							>
								<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
								<circle cx="12" cy="7" r="4" />
							</svg>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
