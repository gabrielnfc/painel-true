'use client';

import { Square, RotateCcw, Send, User, Bot, Loader2 } from 'lucide-react';

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
