import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityIndicatorProps {
	level: number;
	daysDelayed: number;
	className?: string;
}

const priorityConfig = {
	1: { label: 'Baixa', color: 'bg-green-500', textColor: 'text-green-700' },
	2: { label: 'Média-Baixa', color: 'bg-blue-500', textColor: 'text-blue-700' },
	3: { label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
	4: { label: 'Alta', color: 'bg-orange-500', textColor: 'text-orange-700' },
	5: { label: 'Crítica', color: 'bg-red-500', textColor: 'text-red-700' },
};

export function PriorityIndicator({
	level,
	daysDelayed,
	className,
}: PriorityIndicatorProps) {
	// Calcula o nível de prioridade baseado nos dias de atraso
	const calculatePriorityLevel = (days: number) => {
		if (days <= 3) return 1;
		if (days <= 7) return 2;
		if (days <= 14) return 3;
		if (days <= 30) return 4;
		return 5;
	};

	const priorityLevel = calculatePriorityLevel(daysDelayed);
	const config = priorityConfig[priorityLevel as keyof typeof priorityConfig];

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className="flex items-center gap-1.5">
				<div className={cn('h-3 w-3 rounded-full', config.color)} />
				<span className={cn('text-sm font-medium', config.textColor)}>
					Prioridade {config.label}
				</span>
			</div>
			<div className="flex items-center gap-1 text-sm text-muted-foreground">
				<AlertTriangle
					className={cn('h-4 w-4', daysDelayed > 30 && 'text-red-500')}
				/>
				<span className={cn(daysDelayed > 30 && 'text-red-700', 'font-medium')}>
					{daysDelayed} {daysDelayed === 1 ? 'dia' : 'dias'} em atraso
				</span>
			</div>
		</div>
	);
}
