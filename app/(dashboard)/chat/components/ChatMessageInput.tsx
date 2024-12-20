'use client';

import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { cn } from '@/lib/utils';
import { useChat } from 'ai/react';
import { SendIcon } from 'lucide-react';
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { nanoid } from 'nanoid';

export interface ChatMessageInputProps {
	className?: string;
}

export function ChatMessageInput({ className }: ChatMessageInputProps) {
	const { input, setInput, append } = useChat();
	const { formRef, onKeyDown } = useEnterSubmit();
	const inputRef = React.useRef<HTMLTextAreaElement>(null);

	React.useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				if (input.trim()) {
					setInput('');
					await append({
						id: nanoid(),
						content: input,
						role: 'user',
					});
				}
			}}
			ref={formRef}
		>
			<div
				className={cn(
					'relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12',
					className
				)}
			>
				<TextareaAutosize
					ref={inputRef}
					tabIndex={0}
					rows={1}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder="Digite sua mensagem..."
					spellCheck={false}
					className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
				/>
				<div className="absolute right-0 top-4 sm:right-4">
					<button
						type="submit"
						className="inline-flex items-center justify-center rounded-full border bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
						disabled={input.trim().length === 0}
					>
						<SendIcon className="h-4 w-4" />
						<span className="sr-only">Enviar mensagem</span>
					</button>
				</div>
			</div>
		</form>
	);
}
