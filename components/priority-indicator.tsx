import { cn } from '@/lib/utils';

interface PriorityIndicatorProps {
	level: number;
	showLabel?: boolean;
	className?: string;
}

export function PriorityIndicator({
	level,
	showLabel = false,
	className,
}: PriorityIndicatorProps) {
	const getPriorityColor = (level: number) => {
		switch (level) {
			case 4:
				return 'bg-red-500';
			case 3:
				return 'bg-orange-500';
			case 2:
				return 'bg-yellow-500';
			case 1:
				return 'bg-green-500';
			default:
				return 'bg-gray-400';
		}
	};

	const getPriorityLabel = (level: number) => {
		switch (level) {
			case 4:
				return 'Crítica';
			case 3:
				return 'Alta';
			case 2:
				return 'Média';
			case 1:
				return 'Baixa';
			default:
				return 'Não definida';
		}
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className={cn('h-3 w-3 rounded-full', getPriorityColor(level))} />
			{showLabel && (
				<span className="text-sm text-muted-foreground">
					{getPriorityLabel(level)}
				</span>
			)}
		</div>
	);
}
