'use client';

import { UserButton } from '@clerk/nextjs';

export function SidebarHeader() {
	return (
		<div className="flex h-16 items-center justify-between px-4">
			<span className="text-xl font-bold">Order System</span>
			<div className="ml-auto">
				<UserButton afterSignOutUrl="/" />
			</div>
		</div>
	);
}
