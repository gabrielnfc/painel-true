'use client';

import { Message } from 'ai';
import { ChatMessage } from './chat-message';

export interface ChatListProps {
	messages: Message[];
}

export function ChatList({ messages }: ChatListProps) {
	if (!messages.length) {
		return null;
	}

	return (
		<div className="relative mx-auto max-w-2xl px-4">
			{messages.map((message, index) => (
				<div key={index}>
					<ChatMessage message={message} />
				</div>
			))}
		</div>
	);
}
