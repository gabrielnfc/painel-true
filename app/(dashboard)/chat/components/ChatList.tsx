'use client';

import { Message } from 'ai';
import { ChatMessage } from './ChatMessage';

export interface ChatList {
	messages: Message[];
}

export function ChatList({ messages }: ChatList) {
	if (!messages.length) {
		return null;
	}

	return (
		<div className="relative mx-auto max-w-2xl px-4">
			{messages.map((message, index) => (
				<div key={index} className="mb-4">
					<ChatMessage message={message} />
				</div>
			))}
		</div>
	);
}
