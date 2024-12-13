'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/providers/sidebar-provider';

export function SidebarToggle() {
	const { isOpen, toggle } = useSidebar();

	return (
		<div className="lg:hidden fixed top-4 left-4 z-50">
			<Button
				variant="outline"
				size="icon"
				onClick={toggle}
				aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
			>
				<Menu className="h-4 w-4" />
			</Button>
		</div>
	);
}
