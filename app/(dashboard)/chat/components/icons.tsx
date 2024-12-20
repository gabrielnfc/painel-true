'use client';

import { Square, RotateCcw, Send, User, Bot, Loader2 } from 'lucide-react';
import { LucideProps } from 'lucide-react';

export function IconStop({ className, ...props }: React.ComponentProps<'svg'>) {
	return <Square className={className} {...props} />;
}

export function IconRefresh({
	className,
	...props
}: React.ComponentProps<'svg'>) {
	return <RotateCcw className={className} {...props} />;
}

export function IconSend({ className, ...props }: React.ComponentProps<'svg'>) {
	return <Send className={className} {...props} />;
}

export function IconUser({ className, ...props }: React.ComponentProps<'svg'>) {
	return <User className={className} {...props} />;
}

export function IconBot({ className, ...props }: React.ComponentProps<'svg'>) {
	return <Bot className={className} {...props} />;
}

export function IconSpinner({
	className,
	...props
}: React.ComponentProps<'svg'>) {
	return <Loader2 className={`${className} animate-spin`} {...props} />;
}

export function IconCheck({ ...props }: LucideProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	);
}

export function IconCopy({ ...props }: LucideProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
	);
}
