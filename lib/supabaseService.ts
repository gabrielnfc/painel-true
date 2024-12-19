import { supabase } from './supabase';

export interface ChatMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
  order_data?: any;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  last_activity: string;
}

const MAX_SESSIONS_PER_USER = 5; // Máximo de sessões por usuário
const SESSION_INACTIVE_HOURS = 24; // Horas de inatividade antes de limpar
const MAX_MESSAGES_PER_SESSION = 50; // Máximo de mensagens por sessão
const MAX_MESSAGE_LENGTH = 4000; // Tamanho máximo de cada mensagem

export class SupabaseService {
  // Criar ou obter uma sessão existente
  async getOrCreateSession(userId: string): Promise<ChatSession> {
    // Limpa sessões antigas antes de criar uma nova
    await this.cleanupOldSessions();
    
    // Procura por uma sessão ativa do usuário
    const { data: existingSession } = await supabase
      .from('chat_sessions')
      .select()
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    if (existingSession) {
      // Atualiza o último acesso
      await supabase
        .from('chat_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', existingSession.id);
      
      // Limpa mensagens antigas se necessário
      await this.cleanupOldMessages(existingSession.id);
      
      return existingSession;
    }

    // Verifica o número de sessões do usuário
    await this.enforceSessionLimit(userId);

    // Cria uma nova sessão
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return newSession;
  }

  // Limitar número de sessões por usuário
  private async enforceSessionLimit(userId: string): Promise<void> {
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id, last_activity')
      .eq('user_id', userId)
      .order('last_activity', { ascending: true });

    if (sessions && sessions.length >= MAX_SESSIONS_PER_USER) {
      // Remove as sessões mais antigas excedentes
      const sessionsToRemove = sessions.slice(0, sessions.length - MAX_SESSIONS_PER_USER + 1);
      for (const session of sessionsToRemove) {
        await this.clearSession(session.id);
      }
    }
  }

  // Limpar mensagens antigas de uma sessão
  private async cleanupOldMessages(sessionId: string): Promise<void> {
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (count && count > MAX_MESSAGES_PER_SESSION) {
      const { data: oldMessages } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(count - MAX_MESSAGES_PER_SESSION);

      if (oldMessages && oldMessages.length > 0) {
        await supabase
          .from('chat_messages')
          .delete()
          .in('id', oldMessages.map(m => m.id));
      }
    }
  }

  // Adicionar mensagem com validação de tamanho
  async addMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    // Limita o tamanho da mensagem
    const truncatedContent = message.content.slice(0, MAX_MESSAGE_LENGTH);
    
    // Remove dados desnecessários do order_data
    const sanitizedOrderData = message.order_data ? this.sanitizeOrderData(message.order_data) : null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        ...message,
        content: truncatedContent,
        order_data: sanitizedOrderData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Atualiza o timestamp de última atividade da sessão
    await supabase
      .from('chat_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', message.session_id);

    // Limpa mensagens antigas se necessário
    await this.cleanupOldMessages(message.session_id);

    return data;
  }

  // Sanitizar dados do pedido para armazenar apenas o necessário
  private sanitizeOrderData(orderData: any): any {
    if (!orderData) return null;

    // Mantém apenas os campos essenciais
    const {
      numero_pedido,
      situacao_pedido,
      data_pedido,
      total_pedido,
      numero_nota,
      chave_acesso_nota,
      codigo_rastreamento_etiqueta,
      url_rastreamento_etiqueta
    } = orderData;

    return {
      numero_pedido,
      situacao_pedido,
      data_pedido,
      total_pedido,
      numero_nota,
      chave_acesso_nota,
      codigo_rastreamento_etiqueta,
      url_rastreamento_etiqueta
    };
  }

  // Obter mensagens de uma sessão (com limite)
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(MAX_MESSAGES_PER_SESSION);

    if (error) throw error;
    return data;
  }

  // Obter contexto recente (últimas N mensagens)
  async getRecentContext(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    const actualLimit = Math.min(limit, MAX_MESSAGES_PER_SESSION);
    const { data, error } = await supabase
      .from('chat_messages')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(actualLimit);

    if (error) throw error;
    return data.reverse();
  }

  // Limpar sessão
  async clearSession(sessionId: string): Promise<void> {
    await Promise.all([
      supabase.from('chat_messages').delete().eq('session_id', sessionId),
      supabase.from('chat_sessions').delete().eq('id', sessionId)
    ]);
  }

  // Obter estatísticas de uso
  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    oldestSession: string;
    totalMessages: number;
  }> {
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id, created_at')
      .eq('user_id', userId);

    const { count: totalMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('session_id', sessions?.map(s => s.id) || []);

    return {
      totalSessions: sessions?.length || 0,
      oldestSession: sessions?.[0]?.created_at || new Date().toISOString(),
      totalMessages: totalMessages || 0
    };
  }
}

// Exporta uma instância única do serviço
export const supabaseService = new SupabaseService(); 

export const cleanupOldSessions = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .match({ user_id: userId })
      .lt('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Erro ao limpar sessões:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao limpar sessões antigas:', error);
    throw error;
  }
};

export const createChatSession = async (sessionId: string, userId: string) => {
  try {
    // Primeiro, vamos limpar as sessões antigas do usuário
    const { data: oldSessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId);

    if (oldSessions && oldSessions.length > 0) {
      // Deletar todas as mensagens das sessões antigas
      await supabase
        .from('chat_messages')
        .delete()
        .in('session_id', oldSessions.map(session => session.id));
      
      // Deletar todas as sessões antigas
      await supabase
        .from('chat_sessions')
        .delete()
        .in('id', oldSessions.map(session => session.id));
    }

    // Agora criamos a nova sessão
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro detalhado ao criar sessão:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erro completo ao criar sessão:', error);
    throw error;
  }
}; 