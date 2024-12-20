'use client';

import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';
import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
	children: string;
	className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
	return (
		<ReactMarkdown
			className={cn('prose dark:prose-invert', className)}
			components={{
				code: ({ node, inline, className, children, ...props }) => {
					if (inline) {
						return (
							<code className={className} {...props}>
								{children}
							</code>
						);
					}
					return <CodeBlock content={String(children)} />;
				},
			}}
		>
			{children}
		</ReactMarkdown>
	);
}
