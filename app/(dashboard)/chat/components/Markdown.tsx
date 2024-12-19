'use client';

import { memo, FC, useMemo } from 'react';
import { formatMessageWithLinks } from '@/app/lib/formatMessage';

interface MarkdownProps {
	children: string;
}

export const Markdown: FC<MarkdownProps> = memo(({ children }) => {
	const formattedContent = useMemo(
		() => formatMessageWithLinks(children),
		[children]
	);
	return <>{formattedContent}</>;
});

Markdown.displayName = 'Markdown';
