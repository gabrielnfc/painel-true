import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { BigQueryService } from '@/lib/bigquery';
import { systemPrompt } from '@/lib/prompts/system-prompt';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

async function searchOrder(orderId: string) {
  try {
    const bigquery = new BigQueryService();
    const order = await bigquery.searchOrder(orderId);
    return order;
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return null;
  }
}

export async function POST(req: Request) {
  const json = await req.json();
  const { messages } = json;

  // Verifica se a última mensagem do usuário contém um número de pedido
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === 'user') {
    const orderMatch = lastMessage.content.match(/\b\d{5,}\b/);
    if (orderMatch) {
      const orderId = orderMatch[0];
      const orderData = await searchOrder(orderId);
      
      if (orderData) {
        messages.push({
          role: 'system',
          content: `Informações do pedido encontradas: ${JSON.stringify(orderData, null, 2)}`
        });
      }
    }
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages
    ]
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
} 