import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ChatMessage {
    id?: string;
    conversation_id: string;
    content: string;
    sender: 'user' | 'assistant';
    order_data?: any;
    created_at?: string;
}

export class ChatService {
    // Criar ou obter uma conversa existente
    async getOrCreateConversation(userId: string) {
        // Buscar conversa existente
        const { data: existingConversation } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .single();

        if (existingConversation) {
            return existingConversation;
        }

        // Criar nova conversa
        const { data: newConversation, error } = await supabase
            .from('chat_conversations')
            .insert([{ user_id: userId }])
            .select()
            .single();

        if (error) throw error;
        return newConversation;
    }

    // Salvar uma mensagem
    async saveMessage(message: Omit<ChatMessage, 'id' | 'created_at'>) {
        const { error } = await supabase
            .from('chat_messages')
            .insert([message]);

        if (error) throw error;

        // Atualizar timestamp da última mensagem
        await supabase
            .from('chat_conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', message.conversation_id);
    }

    // Carregar mensagens de uma conversa
    async loadMessages(conversationId: string) {
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return messages;
    }

    // Limpar histórico de uma conversa
    async clearConversation(conversationId: string) {
        await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);
    }

    // Verificar se uma conversa existe
    async conversationExists(conversationId: string) {
        const { data } = await supabase
            .from('chat_conversations')
            .select('id')
            .eq('id', conversationId)
            .single();

        return !!data;
    }
} 