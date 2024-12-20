import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { BigQueryService } from '@/lib/bigquery';
import { systemPrompt } from '@/lib/prompts/system-prompt';
import { withRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

interface OrderItem {
  quantidade: number;
  nome: string;
  valor: number | string;
  [key: string]: any;
}

interface ProcessedOrder {
  numero_pedido?: string;
  numero_nota?: string;
  id_pedido?: string;
  numero_ordem_compra?: string;
  cliente_json?: any;
  data_pedido_status?: string;
  data_faturamento_status?: string;
  data_coleta_status?: string;
  data_prevista_entrega_status?: string;
  data_entrega_status?: string;
  data_prevista?: string;
  total_produtos?: string | number;
  total_pedido?: string | number;
  valor_desconto?: string | number;
  nome_transportador?: string;
  status_transportadora?: string;
  url_rastreamento?: string;
  obs_interna?: string;
  situacao_pedido_status?: string;
  forma_frete?: string;
  frete_por_conta?: string;
  itens_pedido?: OrderItem[];
  telefone_status?: string;
  email_status?: string;
  deposito?: string;
  [key: string]: any;
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

// Configurações para otimização de tokens
const MAX_MESSAGES_HISTORY = 10; // Limite de mensagens no histórico
const MAX_MESSAGE_LENGTH = 1000; // Limite de caracteres por mensagem
const MAX_TOKENS = 4000; // Limite de tokens para o modelo
const MAX_ITEMS_TO_SEND = 20; // Limite de itens do pedido a enviar

// Função para truncar texto mantendo palavras completas
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, text.substr(0, maxLength).lastIndexOf(' ')) + '...';
}

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

// Função para limpar e preparar os dados do pedido
function prepareOrderData(order: any): ProcessedOrder | null {
  if (!order) return null;
  
  // Função para formatar valores monetários
  const formatMoney = (value: number | string | null | undefined) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  };

  // Função para processar datas
  const formatDate = (value: string | null | undefined) => {
    if (!value) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    } catch (e) {}
    return value;
  };

  // Processa os dados antes de retornar
  const processedData: ProcessedOrder = {
    ...order,
    // Formata apenas os campos que precisam de formatação especial
    cliente_json: typeof order.cliente_json === 'string' ? JSON.parse(order.cliente_json) : order.cliente_json,
    data_pedido_status: formatDate(order.data_pedido_status),
    data_faturamento_status: formatDate(order.data_faturamento_status),
    data_coleta_status: formatDate(order.data_coleta_status),
    data_prevista_entrega_status: formatDate(order.data_prevista_entrega_status || order.data_prevista),
    data_entrega_status: formatDate(order.data_entrega_status),
    data_prevista: formatDate(order.data_prevista),
    total_produtos: formatMoney(order.total_produtos),
    total_pedido: formatMoney(order.total_pedido),
    valor_desconto: formatMoney(order.valor_desconto)
  };

  // Processa os itens do pedido com limite
  if (Array.isArray(order.itens_pedido)) {
    processedData.itens_pedido = order.itens_pedido
      .slice(0, MAX_ITEMS_TO_SEND)
      .map((item: OrderItem) => ({
        quantidade: item.quantidade,
        nome: truncateText(item.nome, 100), // Limita o tamanho do nome do item
        valor: formatMoney(item.valor)
      }));
  }

  // Remove campos internos desnecessários que aumentam o consumo de tokens
  const fieldsToRemove = [
    '_etag',
    '_metadata',
    '_timestamp',
    'created_at',
    'updated_at'
  ];
  
  fieldsToRemove.forEach(field => {
    delete processedData[field];
  });

  return processedData;
}

// Função principal do handler
async function handler(req: NextRequest) {
  const json = await req.json();
  const { messages } = json;

  // Limita o histórico de mensagens e seu tamanho
  const recentMessages = messages
    .slice(-MAX_MESSAGES_HISTORY)
    .map((msg: any) => ({
      ...msg,
      content: truncateText(msg.content, MAX_MESSAGE_LENGTH)
    }));
  
  // Verifica se a última mensagem do usuário contém um número de pedido
  const lastMessage = recentMessages[recentMessages.length - 1];
  let orderData = null;
  
  if (lastMessage.role === 'user') {
    // Nova regex que captura tanto números simples quanto números com hífen
    const orderMatch = lastMessage.content.match(/\b\d{5,}(?:-\d+)?\b/);
    if (orderMatch) {
      const orderId = orderMatch[0]; // Agora mantém o hífen se existir
      const rawOrderData = await searchOrder(orderId);
      if (rawOrderData && Array.isArray(rawOrderData) && rawOrderData.length > 0) {
        orderData = prepareOrderData(rawOrderData[0]);
      }
    }
  }

  // Prepara o prompt do sistema com os dados do pedido
  let finalSystemPrompt = systemPrompt;
  if (orderData) {
    finalSystemPrompt = `${systemPrompt}

DADOS DO PEDIDO PARA FORMATAR:
${JSON.stringify(orderData, null, 0)}

IMPORTANTE: Formate os dados acima EXATAMENTE seguindo o template fornecido no início deste prompt. Mantenha todos os emojis e quebras de linha.`;
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    temperature: 0.5,
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