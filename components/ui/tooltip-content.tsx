import React from 'react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipWrapperProps {
	content: string;
	children: React.ReactNode;
	side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipWrapper({
	content,
	children,
	side = 'top',
}: TooltipWrapperProps) {
	if (!content) return <>{children}</>;

	return (
		<TooltipProvider>
			<Tooltip delayDuration={300}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					side={side}
					className="max-w-[300px] break-words text-xs"
				>
					{content}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
