'use client';

import { useEnterSubmit } from '@/hooks/use-enter-submit';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Message } from 'ai';

export interface ChatMessageInputProps {
	input: string;
	setInput: (value: string) => void;
	append: (message: Message) => Promise<void>;
	isLoading: boolean;
	className?: string;
}

export function ChatMessageInput({
	input,
	setInput,
	append,
	isLoading,
	className,
}: ChatMessageInputProps) {
	const { formRef, onKeyDown } = useEnterSubmit();
	const inputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				if (!input?.trim() || isLoading) {
					return;
				}
				setInput('');
				await append({
					content: input,
					role: 'user',
				});
			}}
			ref={formRef}
		>
			<div className={cn('relative', className)}>
				<TextareaAutosize
					ref={inputRef}
					tabIndex={0}
					rows={1}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Digite sua mensagem..."
					spellCheck={false}
					className="w-full resize-none bg-transparent pr-12 focus:outline-none disabled:opacity-50"
					onKeyDown={onKeyDown}
					disabled={isLoading}
				/>
			</div>
		</form>
	);
}
