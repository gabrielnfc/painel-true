'use client';

import { useEnterSubmit } from '@/lib/hooks/use-enter-submit';
import { cn } from '@/lib/utils';
import { useChat } from 'ai/react';
import { SendIcon } from 'lucide-react';
import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { nanoid } from 'nanoid';
import Image from 'next/image';

export interface ChatMessageInputProps {
	className?: string;
	userImage?: string;
}

export function ChatMessageInput({
	className,
	userImage,
}: ChatMessageInputProps) {
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
			className="relative flex items-end gap-2"
		>
			<div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full overflow-hidden">
				{userImage ? (
					<Image
						src={userImage}
						alt="User Avatar"
						width={32}
						height={32}
						className="object-cover"
					/>
				) : (
					<div className="h-full w-full bg-primary/10 flex items-center justify-center">
						<span className="text-sm font-medium text-primary/50">U</span>
					</div>
				)}
			</div>

			<div
				className={cn(
					'relative flex flex-1 items-center rounded-xl bg-background border shadow-sm',
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
					placeholder="Escreva uma mensagem..."
					spellCheck={false}
					className="min-h-[44px] w-full resize-none bg-transparent px-4 py-[0.7rem] focus-within:outline-none sm:text-sm"
				/>
			</div>

			<button
				type="submit"
				className={cn(
					'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
					input.trim().length === 0
						? 'text-muted-foreground hover:bg-muted'
						: 'bg-blue-500 text-white hover:bg-blue-600'
				)}
				disabled={input.trim().length === 0}
				title="Enviar mensagem"
			>
				<SendIcon className="h-4 w-4" />
			</button>
		</form>
	);
}
