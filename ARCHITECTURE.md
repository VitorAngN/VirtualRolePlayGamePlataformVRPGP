# VTT Lite: Plataforma Distribuída de Gerenciamento de Fichas e Tabuleiro Virtual

## 1. Visão Geral do Projeto
O **VTT Lite** é um Virtual Tabletop focado em performance, facilidade de uso e arquitetura distribuída. Diferente de soluções web tradicionais, o VTT Lite foi projetado para ser um **Aplicativo Desktop Nativo** (instalável), combinando a fluidez de um programa local com o poder de sincronização em tempo real da nuvem.

## 2. A Grande Inovação (O Diferencial vs FoundryVTT)

O FoundryVTT é uma ferramenta fantástica, mas possui duas grandes barreiras: exige configurações complexas de rede (Port Forwarding ou hospedagem dedicada) e sua interface de fichas consome muito espaço na tela de jogo. 

Para resolver isso, o VTT Lite trará **Duas Inovações Principais**:

### Inovação 1: Arquitetura "Zero-Config" com Relay em Nuvem
Em vez de forçar o Mestre a hospedar um servidor em sua própria máquina e abrir portas no roteador, o VTT Lite funciona com uma arquitetura de **Signaling & Relay**. 
* O Mestre abre o programa e cria uma sala.
* O Backend em Go (na nuvem) atua como uma ponte ultrarrápida.
* Os jogadores inserem o código da sala e se conectam instantaneamente via WebSockets mediados pelo Redis. 
* **Resultado:** Experiência "plug-and-play" sem configurar servidores.

### Inovação 2: Ecossistema "Companion-First" (Segunda Tela)
Um dos maiores problemas dos VTTs é o espaço em tela. O VTT Lite implementará um sistema onde o programa de PC foca **100% no tabuleiro e na imersão visual**. 
* Através de um QR Code gerado no programa de PC, os jogadores podem abrir uma PWA (Progressive Web App) no celular.
* O celular do jogador se transforma na **Ficha do Personagem e Rolador de Dados**.
* Quando o jogador rola o dado no celular, a animação e o resultado aparecem instantaneamente no PC de todos via WebSockets.

---

## 3. Arquitetura Técnica e Stack (Nível Profissional)

Para entregar um programa desktop utilizando tecnologias web (React/PixiJS) sem pesar como o Electron (Discord/Slack), utilizaremos o **Tauri**.

### 3.1. Frontend (O Programa Desktop / Client)
* **Core:** [Tauri](https://tauri.app/) (Permite compilar React para `.exe`, `.app` ou `.deb` usando webviews nativos do SO. O instalador final tem menos de 10MB e consome pouquíssima RAM).
* **UI/UX:** React.js com TailwindCSS (ou Shadcn UI para componentes profissionais).
* **Motor Gráfico:** PixiJS em conjunto com React-Pixi para o grid 2D, permitindo renderizar milhares de tokens e luzes dinâmicas via WebGL a 60 FPS.
* **State Management:** Zustand (gerenciamento local) integrado com o client de WebSocket.

### 3.2. Backend (O Motor de Sincronia / Cloud)
* **Linguagem:** Golang (Para máxima eficiência de concorrência com Goroutines).
* **Protocolo:** WebSockets (biblioteca `gorilla/websocket`).
* **Arquitetura de Mensageria:** Padrão Pub/Sub (Publish/Subscribe). Os clientes assinam tópicos (ex: `sala-123-tabuleiro`, `sala-123-chat`).
* **Game Engine (Backend):** Uma Máquina de Estados Finita (FSM) em Go validará de quem é o turno e se os movimentos são válidos nas regras da SRD 5e, impedindo trapaças nos clientes.

### 3.3. Persistência de Dados (Infraestrutura Zero-Cost)
* **Memória Quente (State Vivo):** Upstash (Redis Serverless). O estado atual do tabuleiro (X, Y dos tokens, HP atual) reside no Redis para respostas de milissegundos.
* **Memória Fria (Persistência):** Neon.tech (PostgreSQL Serverless). Salva a configuração das campanhas, fichas base dos jogadores e logs de sessão. O Go faz "snapshots" do Redis para o Postgres a cada 5 minutos.

---

## 4. Padrão de Comunicação (Como a Sincronia Funciona)

Para evitar os chamados "Race Conditions" (Dois jogadores movendo o mesmo monstro ao mesmo tempo), a arquitetura não envia estados absolutos, mas sim **Deltas (Ações)** no formato de Padrão Command.

**Exemplo de Fluxo:**
1. **Client (React):** O jogador arrasta o token para `X:5, Y:10`. O cliente não move o token imediatamente (apenas visualmente local).
2. **Client -> Server:** Envia `{ type: "MOVE_TOKEN", tokenId: "goblin-1", x: 5, y: 10 }`.
3. **Server (Go):** Recebe o evento. A FSM verifica: "É o turno desse jogador? O caminho está livre?".
4. **Server -> Redis:** Se válido, atualiza o Redis.
5. **Server -> All Clients:** Faz um Broadcast: `{ type: "TOKEN_MOVED", tokenId: "goblin-1", x: 5, y: 10 }`.
6. **All Clients (React/Pixi):** Animação fluida reflete a mudança para todos.

---

## 5. Estrutura de Repositório Sugerida para o GitHub

Recomenda-se um **Monorepo** usando Git. Isso impressiona recrutadores pois demonstra organização de projetos complexos.

```text
vtt-lite/
├── apps/
│   ├── desktop-client/      # O Programa principal (React + Tauri + PixiJS)
│   └── mobile-companion/    # A PWA para fichas de celular (React)
├── packages/
│   └── srd-core/            # Lógica pura e regras do 5e em TS (compartilhado)
├── server/
│   ├── cmd/                 # Ponto de entrada do backend em Go
│   ├── internal/            # Lógica de negócio Go (FSM, Handlers, DB)
│   └── pkg/                 # Helpers Go
├── infra/                   # Arquivos Docker e CI/CD do GitHub Actions
└── docs/                    # Diagramas de arquitetura, contratos de API
```

## 6. Próximos Passos (Plano de Ação)

Para materializarmos essa arquitetura de forma incremental no ambiente de trabalho:

1. **Setup Inicial:** Inicializar o projeto Tauri + React para criar o executável do programa.
2. **Setup do Backend:** Inicializar o módulo Go e criar o servidor WebSocket simples (Echo).
3. **Prova de Conceito (PoC):** Fazer um quadrado no React/PixiJS se mover no programa de um PC e refletir em outro simulando o Redis pub/sub.
