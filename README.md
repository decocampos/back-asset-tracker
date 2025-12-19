# AssetTracker API - Backend (Group Decode Solution)

Este repositório contém a lógica de negócio, integrações financeiras e processamento de dados do **AssetTracker**. O sistema opera como um Monolito Modular focado em alta performance e segurança.

## 📌 Visão Geral
O backend é responsável por gerenciar o ciclo de vida do investidor, desde o onboarding (cadastro/pagamento) até a inteligência de cálculo de rentabilidade.

### Diferenciais Técnicos:
* **Cálculo de Preço Médio ($PM$):** Lógica automatizada para processar transações.
  $$PM = \frac{\sum (Quantidade \times Valor)}{\text{Total de Quantidade}}$$
* **Processamento Bulk:** Endpoints otimizados para recebimento de grandes volumes de dados (ativos e transações).
* **Segurança:** Middleware de verificação de adimplência e Hashing de dados sensíveis.

---

## 🛠️ Tecnologias Utilizadas
* **Runtime:** Node.js (v20+)
* **Linguagem:** TypeScript
* **Banco de Dados:** PostgreSQL via Supabase
* **Autenticação:** JWT (JSON Web Tokens)
* **Pagamentos:** Stripe API
* **Documentação:** Swagger (Opcional)

---

## 📂 Estrutura de Pastas (Modular)
```text
src/
├── @types/          # Definições de tipos globais
├── config/         # Configurações de API (Stripe, Supabase, App)
├── core/           # Middlewares (Auth, Subscription Check)
├── modules/        # Domínios de Negócio
│   ├── users/      # Cadastro e Indicações
│   ├── assets/     # Gestão de Ativos e Bulk Update
│   ├── finance/    # Transações e Cálculo de Preço Médio
│   └── payments/   # Webhooks e Checkout do Stripe
├── shared/         # Utilitários e Helpers
└── server.ts       # Entrypoint da aplicação
