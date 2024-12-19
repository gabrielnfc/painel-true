'use client';

import { useUser } from '@/hooks/useUser';
import { Chat } from './components/Chat';
import { nanoid } from 'nanoid';

export default function ChatPage() {
	const { user } = useUser();

	if (!user) {
		return <div>Carregando...</div>;
	}

	return (
		<div id="chat-page">
			<Chat />
		</div>
	);
}
