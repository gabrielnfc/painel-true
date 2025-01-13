export const getStatusColor = (status: string): string => {
	switch (status.toLowerCase()) {
		case 'pending':
			return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800';
		case 'in_progress':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 border-blue-200 dark:border-blue-800';
		case 'resolved':
			return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 border-green-200 dark:border-green-800';
		default:
			return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500 border-gray-200 dark:border-gray-800';
	}
}; 