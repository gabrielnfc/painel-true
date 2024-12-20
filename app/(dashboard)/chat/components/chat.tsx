'use client';

import { useChat, Message } from 'ai/react';
import { ChatList } from './chat-list';
import { ChatScrollAnchor } from './chat-scroll-anchor';
import { ChatMessageInput } from './chat-message-input';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ChatProps extends React.ComponentProps<'div'> {
	initialMessages?: Message[];
	id?: string;
}

export function Chat({ id, initialMessages, className }: ChatProps) {
	const chatRef = useRef<HTMLDivElement>(null);
	const { messages, append, reload, stop, isLoading, input, setInput } =
		useChat({
			initialMessages,
			id,
			body: {
				id,
			},
		});

	return (
		<>
			<div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
				<div className="relative mx-auto max-w-2xl px-4">
					<ChatList messages={messages} />
					<ChatScrollAnchor trackVisibility={isLoading} />
				</div>
			</div>
			<div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
				<div className="mx-auto sm:max-w-2xl sm:px-4">
					<div className="px-4 py-2 space-y-4 border-t shadow-lg bg-background sm:rounded-t-xl sm:border md:py-4">
						<ChatMessageInput />
					</div>
				</div>
			</div>
		</>
	);
}
