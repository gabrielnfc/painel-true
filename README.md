# True Source - Sistema de Consulta de Pedidos

Sistema de consulta de pedidos integrado com BigQuery e OpenAI, desenvolvido com Next.js 13 e TypeScript.

## 🚀 Tecnologias

- [Next.js 13](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI API](https://openai.com/)
- [Google BigQuery](https://cloud.google.com/bigquery)

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn
- Conta na OpenAI com API key
- Projeto no Google Cloud com BigQuery configurado

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd pedidos-truesource
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha as variáveis de ambiente no arquivo `.env.local`

5. Execute o projeto em desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
# OpenAI
OPENAI_API_KEY=sua_chave_api_aqui

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=seu_project_id_aqui
GOOGLE_CLOUD_CLIENT_EMAIL=seu_client_email_aqui
GOOGLE_CLOUD_PRIVATE_KEY=sua_private_key_aqui

# Rate Limiting
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
```

## 📦 Deploy

### Deploy na Vercel

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente na interface da Vercel
3. Deploy será automático a cada push na branch principal

### Deploy Manual

1. Construa o projeto:
```bash
npm run build
# ou
yarn build
```

2. Inicie o servidor de produção:
```bash
npm start
# ou
yarn start
```

## 📚 API Documentation

### Endpoints

#### POST /api/chat
Endpoint para interação com o chatbot.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "string"
    }
  ]
}
```

**Response:**
- Stream de texto com a resposta do chatbot

**Rate Limiting:**
- 20 requisições por minuto por IP
- Headers de resposta incluem informações de limite

#### GET /api/orders/report
Endpoint para geração de relatórios.

**Query Parameters:**
- startDate: Data inicial (YYYY-MM-DD)
- endDate: Data final (YYYY-MM-DD)

**Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "number": "string",
      "status": "string",
      // ... outros campos
    }
  ]
}
```

## 🔒 Rate Limiting

O sistema implementa rate limiting para proteger a API contra abusos:

- Limite padrão: 20 requisições por minuto por IP
- Headers de resposta incluem:
  - X-RateLimit-Limit: limite máximo
  - X-RateLimit-Remaining: requisições restantes
  - X-RateLimit-Reset: tempo para reset do limite

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 