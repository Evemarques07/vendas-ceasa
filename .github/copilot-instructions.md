<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Sistema de Controle de Pedidos de Frutas, Legumes e Verduras

Este é um sistema PWA (Progressive Web App) construído com React, TypeScript, Vite e Tailwind CSS para controle de pedidos de frutas, legumes e verduras.

## Arquitetura do Projeto

### Frontend

- React 18 com TypeScript
- Vite como bundler
- Tailwind CSS para estilização
- Progressive Web App (PWA)
- React Router para navegação
- React Hook Form + Zod para formulários e validação
- Axios para comunicação com API

### Backend (Separado)

- FastAPI com Python
- Docker para containerização
- MySQL como banco de dados
- Rclone para upload de imagens para Google Drive

## Estrutura de Módulos

### 1. Autenticação

- Dois tipos de usuário: Administrador e Funcionário
- Administrador: cria pedidos, gerencia produtos/clientes/estoque
- Funcionário: separa pedidos, registra pesos finais

### 2. Cadastros

- **Clientes**: nome, nomeFantasia, cpfOuCnpj, endereco, pontoReferencia, email, telefones
- **Produtos**: descricao, imagem (Google Drive via rclone)

### 3. Vendas

- Registro de pedidos com produtos, quantidades, valores
- Status: "A separar" ou "Separado"
- Pagamento: "Pago" ou "Pendente"
- Recálculo automático após separação com pesos reais

### 4. Estoque

- Entradas (compras)
- Saídas automáticas (vendas)
- Inventário real (auditoria manual)

## Convenções de Código

- Use TypeScript em todos os arquivos
- Componentes funcionais com hooks
- Styled com Tailwind CSS
- Formulários com React Hook Form + Zod
- Estados globais quando necessário
- Nomenclatura em português para domínio do negócio
- Paths absolutos com @ para src/

## Padrões de Design

- Atomic Design para componentes
- Container/Presentational pattern
- Custom hooks para lógica reutilizável
- Context API para estados globais
- Error boundaries para tratamento de erros

## PWA Features

- Instalação via navegador
- Funcionamento offline
- Service worker para cache
- Manifest configurado para ícones e splash screen
