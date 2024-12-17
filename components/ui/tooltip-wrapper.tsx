import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipWrapperProps {
	children: React.ReactNode;
	content: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipWrapper({
	children,
	content,
	side = 'top',
}: TooltipWrapperProps) {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent side={side} className="max-w-[300px] break-words">
					{content}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
