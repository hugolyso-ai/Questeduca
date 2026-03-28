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

### ✅ Fase 10: Tarefas P1 Concluídas (27/03/2025)

#### ✅ Sistema de Giftcards
- [x] Tab de Giftcards no ParentDashboard
- [x] Botões de compra (€5, €10, €20) via Stripe
- [x] Campo de resgate de códigos GIFT-XXXXXXXX
- [x] Exibição de saldo da conta (credit_balance)
- [x] Lista de giftcards comprados
- [x] API `/api/parents/me` com perfil do pai
- [x] API `/api/giftcards/purchase` integrada com Stripe
- [x] API `/api/giftcards/redeem` para resgate

#### ✅ Mapa Interativo de Portugal
- [x] Componente SVG com 20 distritos de Portugal continental
- [x] Açores e Madeira incluídos
- [x] Cores únicas por distrito
- [x] Hover e seleção de distritos
- [x] Integração com `/api/friends/search?district=XXX`
- [x] Toggle entre vista de Mapa e Lista
- [x] Pesquisa combinada por nome + distrito

#### ✅ Opções de Acessibilidade
- [x] Contexto React para gerir configurações globais
- [x] Painel de acessibilidade acessível via ícone de olho
- [x] **Fonte para Dislexia**: OpenDyslexic font
- [x] **Alto Contraste**: Modo preto e branco
- [x] **Modo Daltónico**: 
  - Protanopia (dificuldade com vermelho)
  - Deuteranopia (dificuldade com verde)
  - Tritanopia (dificuldade com azul)
- [x] **Tamanho do Texto**: Pequeno, Médio, Grande, Extra Grande
- [x] Persistência em localStorage
- [x] Botão de repor definições

### ✅ Fase 9: Sistema de Rankings e Amigos (Concluído - 27/03/2025)
- [x] **Rankings**:
  - Ranking por escola (filtrado por school_id)
  - Ranking por distrito
  - Ranking nacional (top 100)
  - Posição do utilizador destacada
  - Medalhas visuais para top 3
  - Ordenado por XP
- [x] **Amigos**:
  - Pesquisa por nome ou escola
  - Sistema de pedidos de amizade
  - Notificação aos pais para aprovação
  - Lista de amigos aprovados
  - Visualização de nível e cidade de cada amigo

### ✅ Fase 11: Tarefas P2 + Sistema de Conquistas Expandido (Concluído - 27/03/2025)

#### ✅ Mini-jogos Pais vs Filhos
- [x] **MiniGamesHub** no ParentDashboard (botão "Jogar" em cada filho)
- [x] **Quiz Duel** - Jogo completo com:
  - Timer de 10 segundos por pergunta
  - Placar em tempo real (jogador vs oponente simulado)
  - 5 perguntas por partida
  - Recompensas: Vitória +50, Empate +25, Derrota +10 moedas
- [x] **Memory Match** - Placeholder "Em breve!"
- [x] **Speed Math** - Placeholder "Em breve!"
- [x] APIs:
  - `GET /api/minigames/quiz-questions` - Perguntas para o quiz
  - `POST /api/minigames/result` - Guardar resultado e atribuir moedas
  - `GET /api/minigames/history` - Histórico de jogos

#### ✅ Webhooks Stripe Expandidos
- [x] `checkout.session.completed` - Cria subscrição e ativa premium
- [x] `invoice.payment_succeeded` - Estende subscrição para renovações
- [x] `customer.subscription.deleted` - Trata cancelamento
- [x] Processamento de comissões para associações (10%)
- [x] Atualização automática de status premium dos pais

#### ✅ Sistema de Conquistas Expandido (22 Badges)
- [x] **4 Categorias**:
  - Quiz (7 conquistas): Primeiro Passo, Estudante Aplicado, Mestre do Conhecimento, Génio, Perfeição, Em Chamas!, Dedicação Máxima
  - Cidade (6 conquistas): Construtor, Aldeia Completa, De Aldeia a Vila, Metrópole Nascente, Imperador, Arquiteto Mestre
  - Social (4 conquistas): Primeiro Amigo, Popular, Companheiro de Jogo, Campeão Familiar
  - Recursos (5 conquistas): Poupador, Tesouro, Milionário, Estudante Dedicado, Veterano
- [x] **5 Raridades**: Comum, Incomum, Raro, Épico, Lendário
- [x] **Recompensas** por conquista (XP + Moedas)
- [x] **Barra de progresso** (desbloqueadas/total)
- [x] **Filtros por categoria**
- [x] APIs:
  - `GET /api/achievements/my` - Conquistas e estatísticas do aluno
  - `POST /api/achievements/unlock` - Desbloquear conquista

---

## Backlog Futuro

### P3 - Melhorias Futuras
1. ~~**Memory Match completo**~~ ✅ Concluído - Jogo de memória funcional
2. ~~**Speed Math completo**~~ ✅ Concluído - Desafios matemáticos contra o tempo
3. ~~**Notificações**~~ ✅ Concluído - Sistema de notificações
4. ~~**Modo offline**~~ ✅ Concluído - Cache de perguntas com Service Worker e IndexedDB
5. ~~**Relatórios de progresso**~~ ✅ Concluído via Admin Dashboard e PDF Export

### ✅ Fase 13: Tarefas P4 + Admin + Ligas Mensais (Concluído - 27/03/2025)

#### ✅ Painel de Administração
- [x] **Acesso**: `/admin` ou `/admin/dashboard`
- [x] **Credenciais**: info@serv2all.pt / Quest1234*
- [x] **Obrigatório mudar password** no primeiro login
- [x] **4 Tabs**:
  - Visão Geral: Total utilizadores, alunos, subscrições ativas, receita total
  - Utilizadores: Lista paginada com pesquisa e filtro por role, toggle ativo/inativo
  - Associações: Lista com códigos e comissões
  - Transações: Lista com estado e valores
- [x] **APIs**:
  - `GET /api/admin/dashboard` - Estatísticas gerais
  - `GET /api/admin/users` - Lista paginada de utilizadores
  - `PUT /api/admin/users/{id}/toggle-active` - Ativar/desativar
  - `GET /api/admin/associations` - Lista de associações
  - `GET /api/admin/transactions` - Lista de transações
  - `POST /api/admin/associations/{id}/approve-payout` - Aprovar pagamento

#### ✅ Sistema de Ligas Mensais
- [x] **Liga Mensal** no StudentDashboard > Tab "Liga"
- [x] **Header**: Mês atual, dias restantes
- [x] **Posição do utilizador**: Rank e XP ganho este mês
- [x] **Top 3 Pódio**: Com avatares e medalhas (ouro, prata, bronze)
- [x] **Classificação 4º-10º**: Lista detalhada
- [x] **Recompensas**:
  - 🥇 1º: 100 💎 + Badge Campeão
  - 🥈 2º: 50 💎 + Badge Prata
  - 🥉 3º: 25 💎 + Badge Bronze
  - 4º-10º: 10 💎
- [x] **APIs**:
  - `GET /api/leagues/current` - Dados da liga atual
  - `POST /api/leagues/update-xp` - Atualizar XP do utilizador

#### ✅ Sistema de Notificações
- [x] `GET /api/notifications/my` - Notificações com contagem de não lidas
- [x] `PUT /api/notifications/{id}/read` - Marcar como lida
- [x] `POST /api/notifications/mark-all-read` - Marcar todas como lidas

#### ✅ Change Password com Flag
- [x] `POST /api/auth/change-password` - Alterar password
- [x] Flag `must_change_password` no modelo User
- [x] Modal obrigatório no Admin Dashboard quando flag=True

---

### ✅ Fase 14: Tarefas P5 - Funcionalidades Avançadas (Concluído - 27/03/2025)

#### ✅ Tutorial Interativo
- [x] **Tutorial para Alunos** (8 passos): Bem-vindo, Recursos, Cidade, Aprender, Desafios, Liga, Amigos, Pronto!
- [x] **Tutorial para Pais** (5 passos): Bem-vindo, Filhos, Subscrição, Mini-jogos, Tudo Pronto!
- [x] Aparece apenas no primeiro login (localStorage)
- [x] Destaque visual nos elementos da interface
- [x] Animação de confetti no passo final
- [x] Componente: `/app/frontend/src/components/InteractiveTutorial.js`

#### ✅ Modo Offline (Service Worker + IndexedDB)
- [x] **Service Worker** registado em `index.js`
- [x] Cache de assets estáticos (HTML, CSS, JS)
- [x] Cache de quizzes e disciplinas (cache-first strategy)
- [x] **IndexedDB** para perguntas offline (`questeduca-offline`)
- [x] **Indicador Online/Offline** na barra superior do StudentDashboard
- [x] **Gestor de Cache Offline**: Modal com status de conexão, contagem de perguntas, botão descarregar
- [x] Background sync para respostas pendentes
- [x] Componentes: `OfflineComponents.js`, `useOffline.js`, `service-worker.js`

#### ✅ Exportação de Relatórios PDF
- [x] **Botão "Relatório PDF"** no card de cada filho no ParentDashboard
- [x] **Modal de Export** com:
  - 4 tipos de relatório (Progresso, Conquistas, Atividade, Classificação)
  - 4 opções de período (Última Semana, Último Mês, Este Ano, Tudo)
- [x] **PDF inclui**: Info do aluno, estatísticas gerais, progresso da cidade, desempenho por disciplina, histórico de quizzes, conquistas, recomendações
- [x] Gera HTML e abre em nova janela para impressão/guardar PDF
- [x] **API**: `GET /api/reports/student/{student_id}` (dados completos + histórico)
- [x] Componente: `/app/frontend/src/components/ReportExport.js`

#### ✅ Notificações Push (Básicas + In-App)
- [x] **APIs**:
  - `POST /api/push/subscribe` - Subscrever notificações push
  - `DELETE /api/push/unsubscribe` - Cancelar subscrição
  - `POST /api/notifications/send-push` - Enviar push (fallback para in-app)
- [x] Service Worker recebe push events
- [x] Solicita permissão de notificações no primeiro carregamento
- [x] Fallback para notificações in-app quando push não disponível

---

### ✅ Fase 15: P6 - Modo Escuro e Calendário Escolar (Concluído - 28/03/2025)

#### ✅ Modo Escuro
- [x] **Toggle no Painel de Acessibilidade** (ícone de lua/sol)
- [x] Aplica classes CSS `dark-mode` ao HTML e body
- [x] **Cores do tema escuro**:
  - Background: #0f172a
  - Cards: #1e293b
  - Texto: #f1f5f9
  - Texto secundário: #94a3b8
  - Bordas: #334155
- [x] Persistência via localStorage (`accessibility_settings`)
- [x] Gradientes de botões mantêm-se visíveis
- [x] Compatível com outros modos de acessibilidade

#### ✅ Calendário Escolar
- [x] **Acessível em ambos os dashboards** (StudentDashboard e ParentDashboard)
- [x] **Feriados portugueses auto-atualizados** por ano letivo:
  - 25 de Abril - Dia da Liberdade
  - 1 de Maio - Dia do Trabalhador
  - 10 de Junho - Dia de Portugal
  - 5 de Outubro - Implantação da República
  - 1 de Novembro - Todos os Santos
  - 1 de Dezembro - Restauração da Independência
  - 8 de Dezembro - Imaculada Conceição
  - 25 de Dezembro - Natal
  - 1 de Janeiro - Ano Novo
  - Carnaval e Páscoa (datas variáveis)
- [x] **Eventos QUESTEDUCA**:
  - Novos Desafios Semanais (segundas-feiras)
  - Início da Nova Liga (1º dia do mês)
  - Fim da Liga Mensal (último dia do mês)
- [x] **Funcionalidades**:
  - Navegação entre meses
  - Clique num dia mostra eventos
  - Lista de próximos eventos
  - Estatísticas de desafios e posição na liga
  - Legenda com cores (feriado, férias, escola, desafios, liga)
- [x] Componente: `/app/frontend/src/components/SchoolCalendar.js`

#### ✅ Documentação para Utilizadores
- [x] Manual completo em `/app/docs/MANUAL_UTILIZADOR.md`
- [x] Secções: Primeiros Passos, Para Alunos, Para Pais, Modo Escuro, Calendário, Acessibilidade, Modo Offline, FAQ

---

## Arquitetura Técnica

```
/app/
├── backend/
│   ├── server.py              # FastAPI routes (game, quiz, associations, P5)
│   ├── models.py              # Pydantic models
│   ├── auth.py                # Authentication
│   ├── payment_service.py     # Stripe integration
│   ├── schools_data.py        # Portuguese schools with hierarchy
│   └── question_generator.py  # Claude Sonnet 4.5 integration
├── frontend/
│   ├── public/
│   │   └── service-worker.js  # P5: Offline support
│   └── src/
│       ├── components/
│       │   ├── InteractiveTutorial.js  # P5: Tutorial wizard
│       │   ├── OfflineComponents.js    # P5: Offline UI
│       │   └── ReportExport.js         # P5: PDF export
│       ├── hooks/
│       │   └── useOffline.js           # P5: Offline hooks
│       ├── pages/
│       │   ├── StudentDashboard.js     # RTS city + quizzes + P5
│       │   ├── ParentDashboard.js      # Children + PDF export + P5
│       │   ├── AssociationDashboard.js # Code + commissions
│       │   └── AdminDashboard.js       # Admin panel
│       └── context/
│           ├── AuthContext.js
│           └── AccessibilityContext.js
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

### Rankings
- `GET /api/rankings/school/{school_id}` - Ranking da escola
- `GET /api/rankings/district/{district}` - Ranking do distrito
- `GET /api/rankings/national` - Ranking nacional

### Amigos
- `GET /api/friends/my` - Lista de amigos
- `GET /api/friends/search` - Pesquisa de potenciais amigos
- `POST /api/friends/request` - Enviar pedido de amizade
- `PUT /api/friends/request/{id}/approve` - Aprovar pedido (pais)

### Associações
- `POST /api/associations` - Registar associação
- `GET /api/associations/me` - Perfil da associação
- `GET /api/associations/me/commissions` - Comissões
- `POST /api/associations/me/payout-request` - Solicitar pagamento

### P5: Relatórios e Push
- `GET /api/reports/student/{student_id}` - Dados para relatório PDF
- `POST /api/push/subscribe` - Subscrever push notifications
- `DELETE /api/push/unsubscribe` - Cancelar subscrição
- `POST /api/notifications/send-push` - Enviar notificação

## Credenciais
- **Stripe**: sk_test_emergent
- **Emergent LLM Key**: Claude Sonnet 4.5
- **MongoDB**: localhost:27017
- **Admin**: info@serv2all.pt / Quest1234* (requer mudança de password)

## Links
- Preview: https://edu-empire-1.preview.emergentagent.com
- Test Reports: /app/test_reports/
