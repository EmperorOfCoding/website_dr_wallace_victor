# Deploy no Vercel - Guia Completo

Este guia explica como fazer o deploy do projeto no Vercel.

## Arquitetura de Deploy

O projeto utiliza uma arquitetura **híbrida**:
- **Frontend**: Hospedado no Vercel (React + Vite)
- **Backend**: Deve ser hospedado em outro serviço (Railway, Render, Heroku, etc.)

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Backend já deployado em outro serviço

## Passo 1: Preparar o Backend

O backend precisa estar acessível via HTTPS. Opções recomendadas:

### Railway (Recomendado)
1. Acesse [railway.app](https://railway.app)
2. Conecte seu repositório
3. Configure as variáveis de ambiente do `.env`
4. Deploy automático
5. Copie a URL gerada (ex: `https://seu-projeto.up.railway.app`)

### Render
1. Acesse [render.com](https://render.com)
2. Crie um novo Web Service
3. Conecte seu repositório
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Adicione variáveis de ambiente
6. Copie a URL gerada

### Outras Opções
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run

## Passo 2: Configurar Variáveis de Ambiente

### No Vercel

1. Acesse o dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - **Name**: `VITE_API_URL`
   - **Value**: URL do seu backend (ex: `https://seu-backend.railway.app`)
   - **Environment**: Production

### Localmente (Desenvolvimento)

Crie o arquivo `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

## Passo 3: Deploy no Vercel

### Opção A: Via Dashboard (Mais Fácil)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **Add New** → **Project**
3. Importe seu repositório
4. Vercel detectará automaticamente as configurações do `vercel.json`
5. Clique em **Deploy**

### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Na raiz do projeto
vercel

# Seguir as instruções
# Quando perguntar sobre settings, aceitar as configurações do vercel.json
```

## Passo 4: Atualizar URL da API (Se Necessário)

Se você ainda não configurou a URL do backend:

1. Edite `frontend/.env.production`:
   ```env
   VITE_API_URL=https://seu-backend-real.railway.app
   ```

2. Commit e push para o repositório

3. Vercel fará redeploy automaticamente

**OU** atualize diretamente no dashboard do Vercel:
1. Settings → Environment Variables
2. Edite `VITE_API_URL`
3. Redeploy

## Passo 5: Verificar CORS no Backend

Certifique-se de que o backend permite requisições do domínio do Vercel:

```javascript
// src/app.js
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://seu-dominio.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Estrutura de Arquivos Criados

```
projeto/
├── vercel.json                    # Configuração do Vercel
├── frontend/
│   ├── .env.example              # Exemplo de variáveis
│   ├── .env.production           # Variáveis de produção
│   └── src/
│       └── utils/
│           └── api.js            # Utilitário para API URLs
```

## Configurações do vercel.json

O arquivo `vercel.json` na raiz do projeto contém:

- **buildCommand**: Comando para build do frontend
- **outputDirectory**: Diretório de saída (`frontend/dist`)
- **rewrites**: Configuração SPA (todas as rotas → index.html)
- **headers**: Cache para assets estáticos
- **env**: Referência às variáveis de ambiente

## Uso do Utilitário de API

Para facilitar a migração, foi criado `frontend/src/utils/api.js`:

```javascript
import { apiFetch } from './utils/api';

// Em vez de:
fetch('/api/auth/login', options)

// Use:
apiFetch('/api/auth/login', options)
```

**Nota**: Por enquanto, o código ainda usa `fetch` diretamente. A migração para `apiFetch` é opcional mas recomendada para melhor manutenção.

## Domínio Customizado (Opcional)

1. No dashboard do Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções do Vercel

## Troubleshooting

### Erro 404 nas rotas
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme que os rewrites estão configurados

### API não responde
- Verifique a variável `VITE_API_URL` no Vercel
- Teste a URL do backend diretamente
- Verifique configuração CORS no backend

### Build falha
- Verifique os logs no dashboard do Vercel
- Teste o build localmente: `cd frontend && npm run build`
- Verifique se todas as dependências estão no `package.json`

### Variáveis de ambiente não funcionam
- Variáveis VITE_ devem ser definidas em **build time**
- Após alterar variáveis, faça redeploy
- Verifique se usou `import.meta.env.VITE_*` no código

## Monitoramento

- **Logs**: Dashboard do Vercel → Deployments → View Function Logs
- **Analytics**: Ative Vercel Analytics para métricas de performance
- **Errors**: Configure Vercel Error Tracking ou Sentry

## Próximos Passos

1. ✅ Deploy do backend em serviço escolhido
2. ✅ Configurar `VITE_API_URL` no Vercel
3. ✅ Verificar CORS no backend
4. ✅ Fazer deploy no Vercel
5. ✅ Testar todas as funcionalidades
6. 🔄 (Opcional) Migrar fetch para apiFetch
7. 🔄 (Opcional) Configurar domínio customizado
