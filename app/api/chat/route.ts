import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { systemPrompt } from '@/lib/prompts/system-prompt';
import { withRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';
import { chatService } from '@/lib/services/chat-service';

interface OrderCache {
  orderId: string;
  data: any;
  timestamp: number;
}

let orderCache: OrderCache | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

// Função para verificar se o cache é válido e relevante
function isValidCache(cache: OrderCache | null, messages?: any[]): boolean {
  if (!cache) return false;
  const now = Date.now();
  
  // Verifica validade temporal
  if (now - cache.timestamp >= CACHE_DURATION) return false;
  
  // Se não foram fornecidas mensagens, retorna apenas a validade temporal
  if (!messages) return true;
  
  // Verifica relevância para a conversa atual
  const recentMessages = messages.slice(-5);
  return recentMessages.some(msg => 
    msg.content.includes(cache.orderId) || 
    msg.content.toLowerCase().includes('pedido') ||
    msg.content.match(/\b\d{5,}(?:-\d+)?\b/)
  );
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

// Configurações para otimização de tokens
const MAX_MESSAGES_HISTORY = 15;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOKENS = 4000;

// Função para truncar texto mantendo palavras completas
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, text.substr(0, maxLength).lastIndexOf(' ')) + '...';
}

// Função principal do handler
async function handler(req: NextRequest) {
  const json = await req.json();
  const { messages } = json;

  const recentMessages = messages
    .slice(-MAX_MESSAGES_HISTORY)
    .map((msg: any) => ({
      ...msg,
      content: truncateText(msg.content, MAX_MESSAGE_LENGTH)
    }));
  
  let orderData = null;
  
  // Verifica cache primeiro
  if (orderCache && isValidCache(orderCache, recentMessages)) {
    orderData = orderCache.data;
  }
  
  // Procura por número de pedido na última mensagem do usuário
  const lastUserMessage = recentMessages
    .filter((msg: { role: string; content: string }) => msg.role === 'user')
    .pop();

  // Se não tem cache válido ou se é uma nova solicitação de pedido, busca o pedido
  if (!orderData || (lastUserMessage && lastUserMessage.content.toLowerCase().includes('pedido'))) {
    if (lastUserMessage) {
      // Expressão regular mais flexível para encontrar diferentes formatos de identificação
      const searchPatterns = [
        /\b\d{5,}(?:-\d+)?\b/, // Número do pedido ou ID
        /\b\d{13}-\d{2}\b/,    // Formato ordem de compra (ex: 1485670996616-01)
      ];
      
      let orderId = null;
      
      // Tenta encontrar um match com qualquer um dos padrões
      for (const pattern of searchPatterns) {
        const match = lastUserMessage.content.match(pattern);
        if (match) {
          orderId = match[0];
          break;
        }
      }
      
      if (orderId) {
        console.log('Buscando pedido:', orderId);
        
        // Se o pedido solicitado é diferente do cache atual, busca novo pedido
        if (!orderCache || orderCache.orderId !== orderId) {
          const processedData = await chatService.searchOrder(orderId);
          
          if (processedData) {
            orderData = processedData;
            // Atualiza o cache com o novo pedido
            orderCache = {
              orderId,
              data: processedData,
              timestamp: Date.now()
            };
          } else {
            // Se não encontrou o pedido, limpa o cache
            orderCache = null;
            orderData = null;
          }
        }
      }
    }
  }

  // Prepara o prompt do sistema com os dados do pedido
  let finalSystemPrompt = systemPrompt;
  if (orderData) {
    finalSystemPrompt = `${systemPrompt}

CONTEXTO ATUAL DO PEDIDO #${orderData.numero_pedido}:
${JSON.stringify(orderData, null, 2)}

LEMBRE-SE: 
1. Mantenha este contexto para todas as perguntas sobre este pedido
2. Responda APENAS o que foi perguntado
3. Use os emojis correspondentes
4. Seja direto e conciso`;
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    temperature: 0.3,
    presence_penalty: 0.6,
    frequency_penalty: 0.2,
    stream: true,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'system',
        content: finalSystemPrompt
      },
      ...recentMessages.filter((m: { role: string }) => m.role !== 'system')
    ]
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}

// Exporta o handler com rate limiting
export const POST = withRateLimit(handler); 