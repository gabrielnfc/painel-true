'use client';

import { useEffect, useState } from 'react';
import { ChatComponent } from './components/chat';
import { useUser } from '@/hooks/useUser';

export default function ChatPage() {
	const { user, isLoading } = useUser();
	
	if (isLoading || !user) {
		return <div>Carregando...</div>;
	}

	return (
		<main className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6">
			<div className="flex-1 flex flex-col max-w-[1200px] mx-auto w-full">
				<ChatComponent userId={user.id} />
			</div>
		</main>
	);
}
