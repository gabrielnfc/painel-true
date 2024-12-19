import { createClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          last_activity: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          last_activity?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          last_activity?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
          order_data: any;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at?: string;
          order_data?: any;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          created_at?: string;
          order_data?: any;
        };
      };
    };
  };
};

// Cria o cliente Supabase com tipagem
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    }
  }
);

export { supabase }; 