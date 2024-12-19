import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

export const runtime = 'edge';

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
	try {
		// Verificar autenticação do usuário
		const { userId } = auth();
		if (!userId) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Buscar todas as sessões do usuário
		const { data: sessions } = await supabase
			.from('chat_sessions')
			.select('id')
			.eq('user_id', userId);

		if (sessions && sessions.length > 0) {
			const sessionIds = sessions.map(session => session.id);
			
			// Deletar todas as mensagens das sessões do usuário
			await supabase
				.from('chat_messages')
				.delete()
				.in('session_id', sessionIds);
			
			// Deletar todas as sessões do usuário
			await supabase
				.from('chat_sessions')
				.delete()
				.in('id', sessionIds);
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error cleaning up chat:', error);
		return new Response(JSON.stringify({ success: false, error: 'Failed to cleanup chat' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
} 