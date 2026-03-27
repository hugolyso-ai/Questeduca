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

### ✅ Fase 2: Dados Reais de Escolas Portuguesas (Concluído)
- [x] **243 escolas reais** importadas dos ficheiros Excel oficiais
- [x] Cobertura de todos os 20 distritos portugueses
- [x] Filtros hierárquicos: Distrito → Concelho → Localidade → Escola
- [x] Mapeamento de anos escolares para ciclos

### ✅ Fase 3: Registo de Alunos pelos Pais (Concluído)
- [x] Modal de "Adicionar Filho" no ParentDashboard
- [x] Seleção de ano escolar com filtro automático de escolas por ciclo
- [x] Geração de password temporária para login do aluno
- [x] Vinculação automática pai-filho na base de dados

### ✅ Fase 4: Integração Stripe para Pagamentos (Concluído)
- [x] PaymentService com emergentintegrations/stripe
- [x] Checkout sessions para 4 planos de subscrição
- [x] Páginas de sucesso e cancelamento de pagamento
- [x] Suporte para códigos de associação (comissões 10%)

### ✅ Fase 5: Sistema de Associações de Pais (Concluído)
- [x] Registo de associações com filtros hierárquicos
- [x] Geração automática de código único (ASSOC-XXXXXX)
- [x] Regra dos 10 dias para comissão retroativa
- [x] Sistema de notificações para pais
- [x] Código permanentemente vinculado ao pai

### ✅ Fase 6: Mecânicas RTS - StudentDashboard (Concluído - 25/03/2025)
- [x] **6 Edifícios** com 5 níveis cada:
  - Câmara Municipal: +5-20% moedas
  - Escola: +10-50% XP
  - Biblioteca: 0-ilimitadas dicas nos quizzes
  - Mercado: 0-20% desconto em upgrades
  - Casa: 3-ilimitado quizzes/dia
  - Jardim: 0-5 diamantes/dia
- [x] **Recursos**: Moedas, Diamantes, XP
- [x] **Evolução da Cidade**: Aldeia → Vila → Cidade → Metrópole
- [x] **Conquistas**: 6 conquistas desbloqueáveis
- [x] Interface de cidade com upgrades

### ✅ Fase 7: Geração de Perguntas via LLM (Concluído - 25/03/2025)
- [x] Integração com **Claude Sonnet 4.5** via Emergent LLM Key
- [x] **Disciplinas por ciclo**:
  - 1º Ciclo (1º-4º): Português, Matemática, Estudo do Meio
  - 2º Ciclo (5º-6º): + Ciências, História e Geografia de Portugal, Inglês
  - 3º Ciclo (7º-9º): + Físico-Química, Geografia
- [x] Perguntas de escolha múltipla (4 opções)
- [x] 3 níveis de dificuldade com recompensas diferentes
- [x] Explicações educativas após cada resposta
- [x] Sistema de fallback para erros do LLM

### ✅ Fase 8: Dashboard Associações (Concluído - 25/03/2025)
- [x] Visualização do código único com botão copiar
- [x] **Estatísticas**:
  - Total de comissões acumuladas
  - Valor disponível para levantamento
  - Número de subscrições referidas
- [x] Tabela de histórico de comissões
- [x] Botão de solicitação de payout (mínimo €10)
- [x] Informações dos responsáveis da associação

---

## Backlog (Por Ordem de Prioridade)

### P1 - Importante
1. **Sistema de Giftcards**
   - Geração de códigos de giftcard
   - Resgate de giftcards
   - Tracking para comissões

2. **Mapa Interativo de Portugal**
   - Pesquisa de amigos por escola/distrito
   - Sistema de pedidos de amizade
   - Aprovação parental

3. **Opções de Acessibilidade**
   - Fonte para dislexia (OpenDyslexic)
   - Modo daltónico
   - Alto contraste

### P2 - Futuro
4. **Mini-jogos Pais vs Filhos**
   - Batalhas cooperativas
   - Desafios de conhecimento

5. **Webhooks Stripe**
   - Processamento automático de eventos
   - Renovações automáticas

6. **Sistema de Rankings**
   - Ranking por escola
   - Ranking por distrito

---

## Arquitetura Técnica

```
/app/
├── backend/
│   ├── server.py              # FastAPI routes (game, quiz, associations)
│   ├── models.py              # Pydantic models
│   ├── auth.py                # Authentication
│   ├── payment_service.py     # Stripe integration
│   ├── schools_data.py        # Portuguese schools with hierarchy
│   └── question_generator.py  # Claude Sonnet 4.5 integration
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── StudentDashboard.js    # RTS city + quizzes
│       │   ├── ParentDashboard.js     # Children + subscriptions
│       │   ├── AssociationDashboard.js # Code + commissions
│       │   └── ...
│       └── context/AuthContext.js
└── memory/PRD.md
```

## APIs Principais

### Jogo (Game)
- `GET /api/game/state` - Estado do jogo (recursos, edifícios)
- `POST /api/game/upgrade` - Upgrade de edifício
- `POST /api/game/add-resources` - Adicionar recursos

### Quiz
- `GET /api/subjects/{year}` - Disciplinas por ano
- `GET /api/quiz/generate` - Gerar quiz com Claude
- `POST /api/quiz/submit` - Submeter resposta

### Associações
- `POST /api/associations` - Registar associação
- `GET /api/associations/me` - Perfil da associação
- `GET /api/associations/me/commissions` - Comissões
- `POST /api/associations/me/payout-request` - Solicitar pagamento

## Credenciais
- **Stripe**: sk_test_emergent
- **Emergent LLM Key**: Claude Sonnet 4.5
- **MongoDB**: localhost:27017

## Links
- Preview: https://edu-empire-1.preview.emergentagent.com
- Test Reports: /app/test_reports/
