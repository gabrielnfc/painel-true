'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

export const MemoizedReactMarkdown = React.memo(
	ReactMarkdown,
	(prevProps, nextProps) => prevProps.children === nextProps.children
);
