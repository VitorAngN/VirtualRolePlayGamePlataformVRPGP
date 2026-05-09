# Scrum & Kanban Board: VTT Lite 🚀

Este documento serve como a principal ferramenta de gestão ágil do projeto. Ele mapeia os **Épicos** (Grandes Módulos arquiteturais), as **Sprints** (Ciclos de 1-2 semanas) e as **Histórias de Usuário (User Stories)**. 

Para um projeto de software profissional e em grande escala, o escopo foi detalhadamente fragmentado em pequenas entregas de valor contínuo, cobrindo DevOps, Backend, Engine 2D e Frontends.

---

## 🎯 Épicos (Epics)

* **EPIC 1: DevOps, CI/CD e Infraestrutura Base**
* **EPIC 2: Core do Backend e Autenticação (Golang + Postgres)**
* **EPIC 3: Hub de WebSockets e Distribuição (Gorilla + Redis)**
* **EPIC 4: Máquina de Estados e Motor de Regras (SRD 5e)**
* **EPIC 5: Frontend Tauri & Motor Gráfico (PixiJS)**
* **EPIC 6: Mobile Companion App (PWA & UX Tátil)**

---

## 📋 Backlog do Produto Detalhado (Product Backlog)

### Sprint 1: Fundação, DevOps e Infraestrutura
**Foco:** Preparar o terreno sólido para um desenvolvimento paralelo escalável.
- [ ] **US01:** Como Dev, quero configurar um Monorepo (TurboRepo/Yarn Workspaces) para centralizar o código Client, Mobile e Pacotes de Regras.
- [ ] **US02:** Como Dev, quero configurar o linter (`ESLint` + `Prettier`) para padronização rigorosa do Typescript.
- [ ] **US03:** Como Dev, quero configurar o linter (`golangci-lint`) para as boas práticas no Backend em Go.
- [ ] **US04:** Como DevOps, quero montar a Pipeline CI (GitHub Actions) para rodar testes automatizados do Backend em cada Pull Request.
- [ ] **US05:** Como DevOps, quero montar a Pipeline CI/CD para deploy automático do Companion App na Vercel ou Cloudflare Pages.
- [ ] **US06:** Como DevOps, quero provisionar o banco PostgreSQL Serverless (Neon.tech).
- [ ] **US07:** Como DevOps, quero provisionar o Redis Serverless (Upstash) para o cache de alta performance.
- [ ] **US08:** Como Backend, quero configurar o sistema de Migrations (ex: `golang-migrate`) para versionamento do banco de dados.
- [ ] **US09:** Como Backend, quero estruturar o Logger centralizado (ex: `zap` ou `logrus`) para rastrear erros no servidor.
- [ ] **US10:** Como Dev, quero criar o `.env.example` e documentar a configuração inicial para rodar localmente com Docker Compose.

### Sprint 2: Autenticação e Core REST
**Foco:** Permitir que o Mestre crie contas, faça login e crie salas duráveis.
- [ ] **US11:** Como Backend, quero estruturar o projeto Go usando Clean Architecture (Handlers, UseCases, Repositories).
- [ ] **US12:** Como Backend, quero criar o Schema SQL para Entidades: Usuários, Campanhas e Fichas Base.
- [ ] **US13:** Como Backend, quero implementar a rota REST `POST /api/auth/register` (com hash de senha bcrypt).
- [ ] **US14:** Como Backend, quero implementar a rota REST `POST /api/auth/login` retornando um JWT (JSON Web Token).
- [ ] **US15:** Como Backend, quero criar o Middleware de Autenticação JWT para proteger rotas privadas.
- [ ] **US16:** Como Mestre, quero usar a rota `POST /api/rooms` para criar uma nova sessão/sala persistente.
- [ ] **US17:** Como Jogador, quero usar a rota `GET /api/rooms/:id` para validar se a sala existe antes de me conectar via Socket.

### Sprint 3: O Motor de WebSockets
**Foco:** O coração em tempo real do VTT. Distribuição e controle de estado síncrono.
- [ ] **US18:** Como Backend, quero implementar o Gorilla WebSocket e a rotina de Upgrade de protocolo HTTP para WS.
- [ ] **US19:** Como Backend, quero criar o `RoomManager` (Pool de Conexões) isolando mensagens para não vazar para outras salas.
- [ ] **US20:** Como Backend, quero implementar a rotina de `Ping/Pong` (Heartbeat) para derrubar conexões fantasmas.
- [ ] **US21:** Como Backend, quero estruturar o padrão Pub/Sub no Redis, permitindo escalar o Go horizontalmente (múltiplos pods no futuro).
- [ ] **US22:** Como Backend, quero definir as `Interfaces/Tipagens` exatas de envio e resposta (Eventos: MOVE, ATTACK, ROLL).
- [ ] **US23:** Como Backend, quero criar uma função de `Broadcast` (enviar mensagem para todos na sala) e `BroadcastExclusive` (enviar para todos, menos o emissor).
- [ ] **US24:** Como Backend, quero implementar a interceptação de erros e emissão de pacotes NACK (Rejeição de Evento com explicação).

### Sprint 4: Frontend Desktop e Motor 2D (Tauri + PixiJS)
**Foco:** Ter a tela principal de visualização de mapas.
- [ ] **US25:** Como Dev, quero fazer o Setup do Vite + React compilado via Tauri (gerando o `.exe`).
- [ ] **US26:** Como Frontend, quero construir a Shell da UI (Sidebars, Menu Superior de Ferramentas, Chat lateral) usando ShadcnUI e Tailwind.
- [ ] **US27:** Como Mestre, quero que o Canvas (PixiJS/React-Pixi) preencha o centro da tela.
- [ ] **US28:** Como Mestre, quero poder fazer o Upload de uma imagem `.jpg/.png` que servirá de Background (Mapa) para o Canvas.
- [ ] **US29:** Como Mestre, quero visualizar uma malha quadriculada (Grid 5ft) projetada por cima do mapa.
- [ ] **US30:** Como Frontend, quero conectar o Zustand (State) ao cliente do WebSocket, refletindo as posições iniciais recebidas no load.
- [ ] **US31:** Como Mestre, quero arrastar e soltar (Drag & Drop) um Token de Monstro no Canvas (Client-side prediction).
- [ ] **US32:** Como Frontend, quero que a soltura do Token no Drag&Drop emita o evento `MOVE_TOKEN_INTENT` via Socket.
- [ ] **US33:** Como Jogador (vendo a tela do PC), quero que o Token se mova com uma animação de interpolação suave (Lerp) ao receber a atualização do servidor, e não teletransporte rudemente.
- [ ] **US34:** Como Mestre, quero usar uma ferramenta de "Régua" para desenhar linhas no Canvas medindo a distância entre tokens.

### Sprint 5: Regras e a Máquina de Estados (Backend FSM)
**Foco:** Garantir que as regras do RPG funcionem e trapaças sejam impossíveis.
- [ ] **US35:** Como Backend, quero criar o pacote TypeScript/Go compartilhado (`srd-core`) com as estruturas e regras básicas do D&D 5e (Atributos, Proficiências, CA).
- [ ] **US36:** Como Backend, quero implementar o algoritmo para converter Modificadores (ex: Força 16 = +3).
- [ ] **US37:** Como Backend, quero implementar a FSM no Game Loop que alterna o Status da Sala entre `EXPLORATION` e `COMBAT`.
- [ ] **US38:** Como Backend, quero que o servidor trave a movimentação livre caso a Sala entre em `COMBAT_INITIATIVE_ROLL`.
- [ ] **US39:** Como Backend, quero que o servidor ordene a fila de iniciativa quando todos submeterem seus resultados.
- [ ] **US40:** Como Backend, quero barrar (via FSM) o movimento de um Token se não for o turno do respectivo dono (PlayerID).
- [ ] **US41:** Como Backend, quero escrever a rotina CronJob que pega o estado atual da Sala do Redis e salva o Snapshot no Postgres a cada 5 minutos para durabilidade.

### Sprint 6: Mobile Companion (A Segunda Tela)
**Foco:** O controle na palma da mão. Fim do excesso de janelas no PC.
- [ ] **US42:** Como Frontend, quero iniciar o projeto PWA (React) com layout mobile-first focado no polegar do usuário.
- [ ] **US43:** Como Mestre, quero clicar em "Convidar" no PC e exibir um QR Code contendo a URL profunda da Sala.
- [ ] **US44:** Como Jogador, quero usar a câmera nativa do celular para ler o QR Code e entrar direto na PWA autenticada na sala.
- [ ] **US45:** Como Jogador (Mobile), quero visualizar as barras vitais do meu personagem (HP Máximo/Atual, CA) em tempo real.
- [ ] **US46:** Como Jogador (Mobile), quero botões de (+ e -) para ajustar meu HP. O ajuste deve emitir socket imediato.
- [ ] **US47:** Como Jogador (Mobile), quero visualizar a aba de "Ações" contendo minhas Armas Equipadas.
- [ ] **US48:** Como Jogador (Mobile), quero clicar em "Ataque com Espada" na PWA e enviar o evento ao servidor.
- [ ] **US49:** Como Frontend (Mobile), quero que o celular ative a vibração tátil (`navigator.vibrate`) ao confirmar que o servidor processou o ataque.
- [ ] **US50:** Como Frontend (Desktop), quero interceptar o evento de Ataque vindo do Mobile e gerar um log de Dano ou Animação Visual no chat do PC.

### Sprint 7: Ferramentas Avançadas (Stretch Goals)
**Foco:** Polimento de alto nível para brilhar no portfólio.
- [ ] **US51:** Como Mestre, quero oclusão básica (Fog of War manual) para ocultar salas da Dungeon no PixiJS.
- [ ] **US52:** Como Jogador (Mobile), quero acessar uma aba de Inventário para dar "drop" de itens.
- [ ] **US53:** Como Jogador (Mobile), quero uma aba de Magias para marcar meus "Spell Slots" gastos dinamicamente.
- [ ] **US54:** Como QA, quero escrever Testes E2E (Playwright) para o fluxo de "Entrar em Sala via QR Code simulado".
- [ ] **US55:** Como QA, quero rodar testes de Carga (k6) no servidor WebSocket simulando 500 conexões ativas.

---

## 🚦 Kanban (Mural de Tarefas)

> **Regra de Ouro:** Não traga mais de 3 US para "In Progress" por vez. Foco na entrega!

### 📝 TODO (Backlog Restante)
* [US04 a US55]

### ⚙️ IN PROGRESS (Em Andamento)
* [US01] Configurar Monorepo
* [US02] Configurar Linter Typescript
* [US03] Configurar Linter Golang

### 👀 REVIEW (Em Revisão/Testes)
* *(Vazio)*

### ✅ DONE (Concluído)
* Desenho da Arquitetura e Inovações Base
* Criação do Board Granular de Múltiplos Épicos
