import { Suspense } from 'react';
import { AlertsList } from './alerts-list';
import { Skeleton } from '@/components/ui/skeleton';

function AlertsLoading() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="flex items-center space-x-4">
					<Skeleton className="h-12 w-full" />
				</div>
			))}
		</div>
	);
}

export function AlertsStream() {
	return (
		<Suspense fallback={<AlertsLoading />}>
			<AlertsList />
		</Suspense>
	);
}
