# Dr. Wallace Victor - Sistema de Agendamento

Sistema completo de agendamento de consultas médicas desenvolvido para o Dr. Wallace Victor.

## 🚀 Funcionalidades

### Para Pacientes
- ✅ **Agendamento online** - Agende consultas de forma fácil e rápida
- ✅ **Minha Agenda** - Visualize, cancele e reagende suas consultas
- ✅ **Histórico de consultas** - Acesse consultas passadas e futuras
- ✅ **Avaliação pós-consulta** - Avalie o atendimento com estrelas e comentários
- ✅ **Upload de documentos** - Envie exames e documentos antes da consulta
- ✅ **Perfil completo** - Gerencie dados pessoais, alergias e contato de emergência
- ✅ **Lembretes automáticos** - Receba lembretes por e-mail 24h e 1h antes
- ✅ **Exportar para calendário** - Sincronize com Google Calendar ou baixe arquivo .ics
- ✅ **Modo escuro** - Alterne entre tema claro e escuro
- ✅ **PWA** - Instale como app no celular

### Para Administradores
- ✅ **Dashboard de métricas** - Gráficos de consultas, taxa de cancelamento, avaliações
- ✅ **Calendário visual** - Visualize toda a agenda em formato de calendário
- ✅ **Gestão de pacientes** - Busca, listagem e gerenciamento de pacientes
- ✅ **Gestão de agenda** - Bloqueie horários e gerencie disponibilidade
- ✅ **Avaliações recebidas** - Veja feedback dos pacientes

### Técnicas
- ✅ **React Router** - URLs amigáveis e navegação moderna
- ✅ **Animações** - Transições suaves com Framer Motion
- ✅ **Rate Limiting** - Proteção contra ataques
- ✅ **Logging estruturado** - Monitoramento com Winston
- ✅ **Testes automatizados** - Jest + Supertest
- ✅ **Acessibilidade** - Conformidade WCAG
- ✅ **Responsividade** - Funciona em qualquer dispositivo

## 🛠️ Tecnologias

### Frontend
- React 18
- React Router DOM
- Framer Motion (animações)
- FullCalendar (calendário)
- Recharts (gráficos)
- CSS Modules
- Vite

### Backend
- Node.js
- Express
- MySQL
- JWT (autenticação)
- Nodemailer (e-mails)
- Winston (logs)
- Multer (uploads)
- node-cron (agendamentos)
- ical-generator (calendário)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- MySQL 8+

### Backend

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Criar banco de dados
mysql -u root -p < sql/schema.sql     # Estrutura completa
mysql -u root -p < sql/dml.sql        # Dados de exemplo

# Iniciar servidor
npm start
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# Servidor
PORT=3000
NODE_ENV=production

# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=dr_wallace

# JWT
JWT_SECRET=seu_secret_muito_seguro

# E-mail (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu_email@gmail.com
MAIL_PASSWORD=sua_senha_de_app
MAIL_FROM=Dr. Wallace Victor <contato@drwallacevictor.com>

# URLs
PASSWORD_RESET_URL=https://seudominio.com/reset-password
CORS_ORIGIN=https://seudominio.com

# WhatsApp Business API (opcional)
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id

# Notificações
ENABLE_NOTIFICATIONS=true
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

## 📱 PWA

O sistema é uma Progressive Web App e pode ser instalado no celular:

1. Acesse o site pelo navegador
2. Toque em "Adicionar à tela inicial" (ou similar)
3. Pronto! O app funciona offline e recebe notificações

## 📁 Estrutura do Projeto

```
├── frontend/
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── sw.js            # Service Worker
│   └── src/
│       ├── components/      # Componentes reutilizáveis
│       ├── context/         # Context API
│       ├── hooks/           # Custom hooks
│       └── pages/           # Páginas da aplicação
├── src/
│   ├── config/              # Configurações
│   ├── controllers/         # Controllers da API
│   ├── middlewares/         # Middlewares Express
│   ├── routes/              # Rotas da API
│   └── services/            # Lógica de negócio
├── sql/
│   ├── schema.sql           # Estrutura completa do banco
│   └── dml.sql              # Dados de exemplo
└── tests/                   # Testes automatizados
```

## 🔐 Segurança

- Senhas hasheadas com bcrypt
- Autenticação JWT
- Rate limiting em rotas sensíveis
- CORS configurável
- Validação de inputs
- Proteção contra SQL injection

## 📧 E-mails Automáticos

O sistema envia automaticamente:
- ✉️ Confirmação de agendamento
- ⏰ Lembrete 24h antes da consulta
- ⏰ Lembrete 1h antes da consulta
- ❌ Notificação de cancelamento
- 🔑 Link de recuperação de senha

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com ❤️ para o Dr. Wallace Victor
