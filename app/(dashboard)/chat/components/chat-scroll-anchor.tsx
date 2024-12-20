'use client';

import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface ChatScrollAnchorProps {
	trackVisibility?: boolean;
}

export function ChatScrollAnchor({ trackVisibility }: ChatScrollAnchorProps) {
	const { ref, entry, inView } = useInView({
		trackVisibility,
		delay: 100,
		rootMargin: '0px 0px -150px 0px',
	});

	useEffect(() => {
		if (trackVisibility && !inView) {
			entry?.target.scrollIntoView({
				block: 'start',
			});
		}
	}, [inView, trackVisibility, entry]);

	return <div ref={ref} className="h-px w-full" />;
}
