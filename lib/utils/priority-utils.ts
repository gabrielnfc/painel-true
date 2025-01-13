export const getPriorityNumber = (priority: 'critical' | 'high' | 'medium' | 'low'): number => {
	switch (priority) {
		case 'critical':
			return 4;
		case 'high':
			return 3;
		case 'medium':
			return 2;
		case 'low':
			return 1;
		default:
			return 1;
	}
};

export const getPriorityLabel = (nivel: number): string => {
	switch (nivel) {
		case 1:
			return 'Baixa';
		case 2:
			return 'Média';
		case 3:
			return 'Alta';
		case 4:
			return 'Crítica';
		default:
			return 'Baixa';
	}
};

export const getPriorityColor = (nivel: number): string => {
	switch (nivel) {
		case 4:
			return 'text-red-500';
		case 3:
			return 'text-orange-500';
		case 2:
			return 'text-yellow-500';
		case 1:
			return 'text-green-500';
		default:
			return 'text-green-500';
	}
};

export const getPriorityBadgeColor = (priority: 'critical' | 'high' | 'medium' | 'low'): string => {
	switch (priority) {
		case 'critical':
			return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 border-red-200 dark:border-red-800';
		case 'high':
			return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500 border-orange-200 dark:border-orange-800';
		case 'medium':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
		case 'low':
			return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500 border-gray-200 dark:border-gray-800';
	}
}; 