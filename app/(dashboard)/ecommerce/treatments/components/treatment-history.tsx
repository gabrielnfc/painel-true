'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreatmentTimeline } from './treatment-timeline';

interface TreatmentHistoryProps {
	treatmentId: number;
}

export function TreatmentHistory({ treatmentId }: TreatmentHistoryProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Histórico de Tratativas</CardTitle>
			</CardHeader>
			<CardContent>
				<TreatmentTimeline treatmentId={treatmentId} />
			</CardContent>
		</Card>
	);
}
