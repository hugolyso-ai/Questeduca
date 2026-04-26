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

### ✅ Fase 2: Dados Reais de Escolas Portuguesas (Concluído - Atualizado 13/04/2025)
- [x] **5125 escolas reais** importadas dos ficheiros Excel oficiais (1º, 2º e 3º ciclos)
- [x] Cobertura de todos os 29 distritos portugueses e 308 concelhos
- [x] Filtros hierárquicos: Distrito → Concelho → Localidade → Escola
- [x] **Pesquisa por texto** em nome, localidade e concelho
- [x] Mapeamento de anos escolares para ciclos

### ✅ Fase 2.1: Mapa de Portugal Realista (Concluído - 26/04/2025)
- [x] **Mapa SVG interativo** baseado em imagem de referência fornecida
- [x] **18 distritos de Portugal Continental** com paths realistas e cores vibrantes
- [x] **Açores** representados no canto superior esquerdo (9 ilhas)
- [x] **Madeira** representada no canto inferior esquerdo (ilha principal + Porto Santo)
- [x] Hover com tooltip mostrando nome e contagem de alunos
- [x] Click em distrito para filtrar pesquisa de amigos
- [x] Textos decorativos "ATLANTIC OCEAN" e "SPAIN"
- [x] Ondas decorativas no oceano
- [x] Componente: `/app/frontend/src/components/PortugalMap.js`

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

### 🔴 Próximas Prioridades (P1)

#### Terreno de Jogo RTS Isométrico
- [ ] Visualização isométrica da cidade do aluno (tipo Age of Empires)
- [ ] Construções evolutivas no mapa
- [ ] Sistema de invasões/defesas
- [ ] Recursos: moedas + materiais (madeira, pedra, ferro, etc.)
- [ ] Formas de gerar materiais na cidade (fazendas, minas, etc.)

#### Visitas a Cidades de Amigos
- [ ] Permissões de visita (autorizados)
- [ ] Visualização do progresso dos amigos
- [ ] Sistema de ajuda/presentes entre amigos

#### Mapa de Portugal Realista
- [ ] Substituir mapa atual por mapa interativo realista
- [ ] Estilo visual mais detalhado (regiões, rios, montanhas)

### P3 - Melhorias Futuras
1. ~~**Memory Match completo**~~ ✅ Concluído - Jogo de memória funcional
2. ~~**Speed Math completo**~~ ✅ Concluído - Desafios matemáticos contra o tempo
3. ~~**Notificações**~~ ✅ Concluído - Sistema de notificações
4. ~~**Modo offline**~~ ✅ Concluído - Cache de perguntas com Service Worker e IndexedDB
5. ~~**Relatórios de progresso**~~ ✅ Concluído via Admin Dashboard e PDF Export

### ✅ Fase 15: Melhorias Dashboard Aluno (Concluído - 13/04/2025)
- [x] **Tab Mini-Jogos**: Adicionada ao dashboard do aluno com 6 jogos
- [x] **Escolas completas**: 5125 escolas importadas dos 3 ciclos
- [x] **Pesquisa avançada**: Por texto, distrito, concelho, localidade
- [x] **Tutorial melhorado**: Overlay com cutout para destacar elementos
- [x] **Reset de password**: Endpoint admin para resetar password de utilizadores

### ✅ Fase 16: Sistema RTS Completo (Concluído - 13/04/2025)

#### ✅ Vista Isométrica da Cidade
- [x] 12 edifícios em grid isométrico com posições fixas
- [x] Edifícios com ícones coloridos e badges de nível
- [x] Animações de hover e produção
- [x] Sol e nuvens animadas no céu
- [x] Nome da cidade personalizável

#### ✅ Sistema de Recursos
- [x] 6 tipos de recursos: Moedas, Diamantes, Madeira, Pedra, Ferro, Comida
- [x] Barra de recursos visual no topo
- [x] Estatísticas da cidade: População, Defesa, Ataque

#### ✅ Edifícios de Produção
- [x] Quinta (comida), Serração (madeira), Pedreira (pedra), Mina (ferro), Mercado (moedas)
- [x] Sistema de timers para produção
- [x] Recolha de recursos quando pronto
- [x] Produção escalável por nível do edifício

#### ✅ Sistema de Batalha e Social
- [x] Tab "Batalha" no dashboard do aluno
- [x] Sistema de raids a outras cidades
- [x] Cálculo de batalha (ataque vs defesa + dado)
- [x] Saque de recursos em vitória (10% do defensor)
- [x] Histórico de batalhas
- [x] Sistema de visitas a amigos (com permissões)
- [x] Envio de presentes entre amigos (moedas, materiais)
- [x] Notificações de ataques e presentes
- [x] Limite de 3 raids por dia

### ✅ Fase 14: Painel Admin Avançado (Concluído - 06/04/2025)

#### ✅ Gestão de Giftcards
- [x] **Emissão Manual**: Criar giftcards sem pagamento (€5, €10, €20, €50)
- [x] **Quantidade em lote**: Até 100 giftcards de uma vez
- [x] **Notas**: Campo para identificar motivo (ex: prémio, cortesia)
- [x] **Estatísticas**: Total, ativos, resgatados, valor ativo em circulação
- [x] **Desativação**: Possibilidade de desativar giftcards ativos

#### ✅ Gestão de Utilizadores Avançada
- [x] **Edição completa**: Nome, email, role, estado
- [x] **Eliminação**: Soft delete (desativação permanente)
- [x] **Validações**: Não permite editar/eliminar admins

#### ✅ Gestão de Subscrições
- [x] **Criação manual**: Atribuir subscrição a utilizador (cortesia/prémio)
- [x] **Edição**: Alterar estado e data de expiração
- [x] **Filtros**: Por estado (ativo, cancelado, expirado)

#### ✅ Gestão de Associações
- [x] **Edição**: Nome, escola, IBAN, estado de aprovação
- [x] **Eliminação**: Com verificação de pagamentos pendentes

#### ✅ Gestão de Escolas
- [x] **Listagem**: Com pesquisa e filtro por distrito
- [x] **Criação**: Adicionar novas escolas à base de dados
- [x] **Edição**: Nome, distrito, concelho, localidade, ciclo
- [x] **Eliminação**: Com verificação de alunos associados

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

### Admin Dashboard (06/04/2025)
- `POST /api/admin/giftcards/issue` - Emitir giftcards manualmente
- `GET /api/admin/giftcards` - Listar todos os giftcards com estatísticas
- `PUT /api/admin/giftcards/{id}/deactivate` - Desativar giftcard
- `PUT /api/admin/users/{id}` - Editar utilizador
- `DELETE /api/admin/users/{id}` - Eliminar utilizador (soft delete)
- `POST /api/admin/users/{id}/reset-password` - Resetar password de utilizador
- `PUT /api/admin/subscriptions/{id}` - Editar subscrição
- `POST /api/admin/subscriptions/create` - Criar subscrição manual
- `PUT /api/admin/associations/{id}` - Editar associação
- `DELETE /api/admin/associations/{id}` - Eliminar associação
- `GET /api/admin/schools` - Listar escolas com filtros
- `POST /api/admin/schools` - Criar escola
- `PUT /api/admin/schools/{id}` - Editar escola
- `DELETE /api/admin/schools/{id}` - Eliminar escola

### ✅ Bugfixes (26/04/2025)
- [x] **Pydantic ValidationError em StudentProfile** - Campos `student_id`, `nickname`, `school_year`, `school_name`, `district` agora são Optional para suportar dados legados
- [x] **TypeError em rankings** - Função `calculate_building_total()` criada para lidar com buildings como dicts aninhados
- [x] **DuplicateKeyError em Google Auth** - Session insertion alterada para upsert, evitando erros de chave duplicada

### ✅ Sistema de Streak Diário (26/04/2025)
- [x] **Backend endpoints**: `GET /api/streak/status`, `POST /api/streak/claim`
- [x] **Tracking de streak**: current_streak, longest_streak, last_streak_date
- [x] **Sistema de bónus**: 1-5 diamantes baseado no número de dias consecutivos
- [x] **Milestones**: Iniciante → Consistente (3d) → Dedicado (7d) → Mestre (14d) → Lenda (30d)
- [x] **UI Component**: `/app/frontend/src/components/DailyStreak.js` integrado no tab de Quiz
- [x] **Funcionalidades**:
  - Barra de progresso para próximo bónus
  - Stats: Recorde, Bónus atual, Estado de hoje
  - Botão de reclamar bónus com animação de celebração
  - Dicas para manter o streak

### ✅ Cidade RTS Realista (26/04/2025)
- [x] **Visual inspirado** em Age of Empires, Warhammer 40k, Shadow Tactics
- [x] **SVG interativo** com edifícios medievais detalhados
- [x] **Muralhas do castelo** com torres, portões e bandeiras
- [x] **12 tipos de edifícios** com telhados coloridos e janelas
- [x] **Atmosfera viva**: nuvens animadas, sol, pássaros, fumo das chaminés
- [x] **Caminhos e terreno**: estradas, campos agrícolas, árvores decorativas
- [x] **Controlos**: Zoom in/out, reset view
- [x] **Painel de edifício** com upgrade, produção e recolha de recursos
- [x] **Banner "Reino de [Nome]"** estilizado

### ✅ Sistema de Pacotes Sazonais (26/04/2025)
- [x] **4 pacotes temáticos**: Natal 🎄, Carnaval 🎭, Verão ☀️, Páscoa 🐰
- [x] **Descontos**: 20-40% por tempo limitado
- [x] **Conteúdo**: Diamantes, skins de edifícios, decorações, moedas
- [x] **Timer de expiração**: Contagem regressiva dinâmica
- [x] **UI atraente**: Cards com gradientes temáticos e efeitos
- [x] **Explicação**: Secção "Como funcionam os Pacotes Sazonais?"
- [x] **Preparado para integração** com Stripe

## Credenciais
- **Stripe**: sk_test_emergent
- **Emergent LLM Key**: Claude Sonnet 4.5
- **MongoDB**: localhost:27017
- **Admin**: info@serv2all.pt / Quest1234*
- **Aluno Teste**: aluno@teste.pt / Aluno1234*

## Links
- Preview: https://edu-empire-1.preview.emergentagent.com
- Test Reports: /app/test_reports/
