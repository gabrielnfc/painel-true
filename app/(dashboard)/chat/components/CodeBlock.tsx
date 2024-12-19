'use client';

import { Button } from '@/components/ui/button';
import { IconCheck, IconCopy } from './icons';
import { useState } from 'react';

interface CodeBlockProps {
	language: string;
	value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
	const [isCopied, setIsCopied] = useState(false);

	const onCopy = () => {
		navigator.clipboard.writeText(value);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	return (
		<div className="relative w-full">
			<div className="flex items-center justify-between px-4 py-2 bg-primary/5">
				<span className="text-xs lowercase text-primary/60">{language}</span>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={onCopy}
				>
					{isCopied ? <IconCheck /> : <IconCopy />}
					<span className="sr-only">Copy code</span>
				</Button>
			</div>
			<pre className="overflow-x-auto p-4">
				<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
					{value}
				</code>
			</pre>
		</div>
	);
}
