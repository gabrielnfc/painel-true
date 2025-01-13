'use client';

import { Button } from '@/components/ui/button';
import { IconCheck, IconCopy } from './icons';
import { useState } from 'react';

interface CodeBlockProps {
	content: string;
}

export function CodeBlock({ content }: CodeBlockProps) {
	const [isCopied, setIsCopied] = useState(false);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy code to clipboard:', error);
		}
	};

	return (
		<div className="relative">
			<Button
				size="icon"
				variant="ghost"
				className="absolute right-2 top-2 h-6 w-6"
				onClick={copyToClipboard}
			>
				{isCopied ? <IconCheck /> : <IconCopy />}
				<span className="sr-only">Copy code</span>
			</Button>
			<pre>
				<code>{content}</code>
			</pre>
		</div>
	);
}
