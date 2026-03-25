# QUESTEDUCA - PRD (Product Requirements Document)

## Problema Original
Criar jogo educativo RTS (QUESTEDUCA) para o 1º, 2º e 3º ciclos do ensino básico em Portugal (1º ao 9º ano). O aluno responde a perguntas do currículo escolar para ganhar recursos (dinheiro, diamantes) e evoluir sua cidade.

## Utilizadores
1. **Pais** - Gerem contas, subscrevem premium, ajudam em mini-jogos
2. **Alunos** - Jogam o RTS principal, respondem quizzes, batalham
3. **Associações de Pais** - Recebem comissões via códigos de afiliado (10%)

## Requisitos Core
- Subscrições: Individual (1,99€/mês) ou Familiar (4,99€/mês para até 3 alunos)
- Opções anuais com 10% desconto
- Integração de pagamentos via Stripe
- Sistema de Giftcards
- Mapa de Portugal realista para pesquisa de amigos
- Acessibilidade: opções para dislexia, dificuldades visuais e daltonismo
- Perguntas baseadas no currículo oficial português (usar IA para gerar)

---

## O que foi Implementado

### ✅ Fase 1: Infraestrutura Base (Concluído)
- [x] Projeto FastAPI + React + MongoDB configurado
- [x] Sistema de autenticação JWT com cookies
- [x] Modelos de dados (Users, Students, Parents, Associations, etc.)
- [x] Rotas básicas de API

### ✅ Fase 2: Dados Reais de Escolas Portuguesas (Concluído - 25/03/2025)
- [x] **243 escolas reais** importadas dos ficheiros Excel oficiais
- [x] Cobertura de todos os 20 distritos portugueses
- [x] Filtro de escolas por distrito e ciclo/ano escolar
- [x] Mapeamento de anos escolares para ciclos (1º-4º → 1º Ciclo, 5º-6º → 2º Ciclo, 7º-9º → 3º Ciclo)

### ✅ Fase 3: Registo de Alunos pelos Pais (Concluído - 25/03/2025)
- [x] Modal de "Adicionar Filho" no ParentDashboard
- [x] Seleção de ano escolar com filtro automático de escolas por ciclo
- [x] Geração de password temporária para login do aluno
- [x] Vinculação automática pai-filho na base de dados
- [x] Listagem de filhos no dashboard

### ✅ Fase 4: Integração Stripe para Pagamentos (Concluído - 25/03/2025)
- [x] PaymentService com emergentintegrations/stripe
- [x] Checkout sessions para 4 planos de subscrição
- [x] Páginas de sucesso e cancelamento de pagamento
- [x] Coleção `payment_transactions` para tracking
- [x] Suporte para códigos de associação (comissões 10%)
- [x] Polling de status de pagamento no frontend

### ✅ UI/UX (Parcialmente Concluído)
- [x] Landing page com estética "Vibrant Play"
- [x] Login e Registo
- [x] ParentDashboard com abas (Visão Geral, Meus Filhos, Subscrição)
- [x] Componentes Shadcn/UI

---

## Backlog (Por Ordem de Prioridade)

### P0 - Crítico
1. **Mecânicas RTS no StudentDashboard**
   - Cidade com edifícios (prefeitura, escola, biblioteca, etc.)
   - Sistema de recursos (moedas, diamantes)
   - Temporizadores de construção
   - Upgrades baseados em respostas corretas

2. **Geração de Perguntas via LLM**
   - Integrar com Emergent LLM Key (GPT-5.2 ou similar)
   - Perguntas por disciplina e ano escolar
   - Sistema de dificuldade progressiva

### P1 - Importante
3. **Dashboard Associações de Pais**
   - Tracking de comissões (10%)
   - Listagem de subscrições referidas
   - Solicitação de pagamentos

4. **Sistema de Giftcards**
   - Geração de códigos
   - Resgate de giftcards
   - Tracking para comissões

5. **Mapa Interativo de Portugal**
   - Pesquisa de amigos por escola/distrito
   - Sistema de pedidos de amizade
   - Aprovação parental

6. **Opções de Acessibilidade**
   - Fonte para dislexia (OpenDyslexic)
   - Modo daltónico
   - Alto contraste

### P2 - Futuro
7. **Mini-jogos Pais vs Filhos**
   - Batalhas cooperativas
   - Desafios de conhecimento

8. **Webhooks Stripe**
   - Processamento automático de eventos
   - Renovações automáticas

9. **Sistema de Notificações**
   - Notificações push
   - Emails transacionais

---

## Arquitetura Técnica

```
/app/
├── backend/
│   ├── server.py          # FastAPI routes
│   ├── models.py          # Pydantic models
│   ├── auth.py            # Authentication
│   ├── payment_service.py # Stripe integration
│   ├── schools_data.py    # 243 Portuguese schools
│   └── question_generator.py
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.js
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── StudentDashboard.js
│       │   ├── ParentDashboard.js
│       │   ├── AssociationDashboard.js
│       │   ├── PaymentSuccess.js
│       │   └── PaymentCancel.js
│       └── context/AuthContext.js
└── memory/PRD.md
```

## Credenciais de Teste
- **Stripe**: sk_test_emergent (modo teste)
- **Emergent LLM Key**: Configurada em backend/.env
- **MongoDB**: localhost:27017

## Links Úteis
- Preview URL: https://edu-empire-1.preview.emergentagent.com
- Test Reports: /app/test_reports/
