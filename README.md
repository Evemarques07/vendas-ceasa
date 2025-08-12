# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Sistema de Controle de Pedidos de Frutas, Legumes e Verduras

Sistema PWA (Progressive Web App) para controle de pedidos de frutas, legumes e verduras, desenvolvido com React, TypeScript, Vite e Tailwind CSS.

## � PWA (Progressive Web App)

### ✨ Funcionalidades PWA Implementadas

- **📲 Instalação no Dispositivo**: Pode ser instalado na tela inicial como um app nativo
- **🔔 Prompt de Instalação**: Notificação automática para instalar o app
- **⚡ Funcionamento Offline**: Cache inteligente para uso sem internet
- **🔄 Atualizações Automáticas**: Service worker mantém o app sempre atualizado
- **🎨 Ícone Personalizado**: Ícones em alta resolução para diferentes tamanhos
- **🔗 Atalhos Rápidos**: Acesso direto para funcionalidades principais
- **📊 Cache de API**: Estratégia NetworkFirst para melhor performance

### 🚀 Como Instalar

1. **Navegador Mobile** (Android/iOS):

   - Acesse o sistema pelo navegador
   - Aguarde a notificação de instalação aparecer (3 segundos)
   - Toque em "Instalar" no prompt que aparece
   - O app será adicionado à tela inicial

2. **Desktop** (Chrome/Edge):

   - Acesse o sistema
   - Clique no ícone de instalação na barra de endereços
   - Ou clique no prompt que aparece automaticamente

3. **Funcionalidades Offline**:
   - Dados em cache permanecem disponíveis
   - Sincronização automática quando voltar online
   - Interface totalmente funcional mesmo sem internet

## �🚀 Tecnologias

### Frontend

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset JavaScript com tipagem estática
- **Vite** - Build tool rápida e moderna
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento para SPAs
- **React Hook Form + Zod** - Formulários e validação
- **Axios** - Cliente HTTP
- **PWA** - Progressive Web App

### Backend (Separado)

- **FastAPI** - Framework Python moderno
- **Docker** - Containerização
- **MySQL** - Banco de dados
- **Rclone** - Sincronização com Google Drive

## 📋 Funcionalidades

### 🔐 Autenticação

- Dois tipos de usuário: **Administrador** e **Funcionário**
- Login seguro com JWT
- Controle de acesso baseado em perfil

### 👥 Gestão de Clientes

- Cadastro completo com CPF/CNPJ
- Endereço e contatos
- Histórico de pedidos

### 📦 Gestão de Produtos

- Cadastro com imagem
- Upload automático para Google Drive
- Controle de ativação/desativação

### 🛒 Sistema de Vendas

- Criação de pedidos com múltiplos produtos
- Diferentes unidades de medida (kg, unidade, litro, etc.)
- Cálculo automático de valores
- Status: "A separar" / "Separado"
- Controle de pagamento: "Pago" / "Pendente"

### ⚖️ Separação de Produtos

- Registro de pesos reais após separação
- Recálculo automático de valores
- Interface específica para funcionários

### 📊 Controle de Estoque

- Registro de entradas (compras)
- Saídas automáticas (vendas)
- Inventário manual para auditoria
- Relatórios de movimentação

### 📱 PWA Features

- Instalação como app nativo
- Funcionamento offline
- Sincronização automática
- Ícones e splash screen personalizados

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+ e npm
- Git

### 1. Clone o repositório

```bash
git clone <repositorio>
cd React-Vendas
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=Sistema Vendas
VITE_PWA_ENABLED=true
```

### 4. Execute o projeto

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificação de código
npm run type-check   # Verificação de tipos TypeScript
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AuthGuard.tsx   # Proteção de rotas
│   ├── Button.tsx      # Componente de botão
│   ├── Input.tsx       # Componente de input
│   └── Loading.tsx     # Componentes de carregamento
├── contexts/           # Contexts do React
│   └── AuthContext.tsx # Context de autenticação
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
│   ├── router.tsx      # Configuração de rotas
│   └── utils.ts        # Funções utilitárias
├── pages/              # Páginas da aplicação
│   ├── DashboardPage.tsx
│   └── LoginPage.tsx
├── services/           # Serviços de API
│   └── api.ts          # Cliente Axios e endpoints
└── types/              # Definições de tipos TypeScript
    └── index.ts        # Tipos principais do sistema
```

## 🔧 Configuração do Backend

O backend deve ser executado separadamente usando FastAPI com Docker:

```bash
# Assumindo que o backend está em outro repositório
docker-compose up -d
```

### Endpoints Esperados

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuário atual
- `GET /api/clientes` - Listar clientes
- `GET /api/produtos` - Listar produtos
- `GET /api/vendas` - Listar vendas
- `GET /api/estoque/resumo` - Resumo do estoque

## 📱 Instalação como PWA

### Android/iOS

1. Abra o site no Chrome/Safari
2. Toque no menu "Adicionar à tela inicial"
3. Confirme a instalação

### Desktop

1. Abra o site no Chrome/Edge
2. Clique no ícone de instalação na barra de endereços
3. Confirme a instalação

## 🎨 Personalização

### Cores do Tema

Edite `tailwind.config.js` para personalizar as cores:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Suas cores personalizadas
      }
    }
  }
}
```

### Ícones PWA

Substitua os arquivos em `public/`:

- `pwa-192x192.png`
- `pwa-512x512.png`
- `favicon.ico`

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através dos issues do GitHub ou email.

---

Desenvolvido com ❤️ para facilitar o controle de vendas

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
