import { cn } from '@/lib/utils';

type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

interface PriorityIndicatorProps {
	level: PriorityLevel;
	className?: string;
}

const PRIORITY_COLORS = {
	low: 'bg-green-500',
	medium: 'bg-yellow-500',
	high: 'bg-orange-500',
	critical: 'bg-red-500',
} as const;

export function PriorityIndicator({
	level,
	className,
}: PriorityIndicatorProps) {
	return (
		<div
			className={cn('h-3 w-3 rounded-full', PRIORITY_COLORS[level], className)}
			title={`Prioridade ${level}`}
		/>
	);
}
