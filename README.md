# VTT Lite (Virtual Tabletop Lite)

![VTT Lite Banner](https://via.placeholder.com/1200x400?text=VTT+Lite+-+Next+Gen+Virtual+Tabletop)

> **Status:** Em Planejamento / PoC (Sprint 1)  
> **Autores:** João Vitor Angelim Nogueira & Lucas Qualy  
> **Disciplina:** Certificadora 2 (Engenharia de Computação - UTFPR)

---

## 📖 Sobre o Projeto
O **VTT Lite** é uma plataforma distribuída de gerenciamento de fichas e tabuleiro virtual em tempo real, focada no sistema D&D 5e (SRD). 

Nascido da necessidade de simplificar sessões complexas e aliviar a sobrecarga visual na tela dos jogadores, o projeto abandona a abordagem pesada de navegadores web cheios de abas (como no FoundryVTT ou Roll20) em favor de um ecossistema **"Companion-First"** usando um programa **Desktop Leve**.

## As Grandes Inovações

1. **Hospedagem "Zero-Config" (Relay Cloud):** Chega de configurar Port Forwarding, Hamachi ou pagar servidores caros. O backend atua como um semáforo de dados em nuvem. O Mestre cria a sala no seu app Desktop, e o Go Server apenas roteia os dados para os jogadores via WebSockets de ultra baixa latência.
2. **Sistema Companion-First (Segunda Tela):** O VTT Lite roda o **Tabuleiro em Tela Cheia no PC**. Os jogadores apontam a câmera do celular para um QR Code na tela, que abre um **Mobile Web App**. O celular vira a Ficha de Personagem, Controle Remoto de Ações e Rolador de Dados.
3. **Máquina de Estados de Servidor (FSM):** Evita trapaças e conflitos. Se dois jogadores arrastarem tokens simultaneamente, o servidor resolve a concorrência via Padrão Command e atualiza as telas instantaneamente.

## Stack Tecnológica e Arquitetura

O projeto adota o padrão Monorepo para consolidar todas as pontas da infraestrutura:

* **Desktop Client (O Tabuleiro):** React.js embutido no **Tauri**, rodando **PixiJS** (WebGL) para performance fluida e gráficos de alto impacto, compilando para um leve `.exe`.
* **Mobile Companion:** React.js focado em Mobile (PWA), rodando direto no navegador do celular.
* **Backend (O Hub):** Golang com Gorilla WebSockets focado em Goroutines concorrentes.
* **Banco de Dados (Infra Zero-Cost):** 
  * **Redis (Upstash):** Para o estado "vivo" das coordenadas do mapa.
  * **PostgreSQL (Neon):** Para guardar dados duráveis das campanhas.

## Organização do Repositório (Documentação)

Mergulhe nos documentos arquiteturais para entender a engenharia de software por trás do VTT Lite:

* 🏗️ [A Arquitetura Completa do Sistema](./ARCHITECTURE.md)
* 📱 [O Sistema de "Segunda Tela" (Mobile Companion)](./docs/COMPANION_APP.md)
* ⚙️ [FSM (Finite State Machine) de Combate no Go](./docs/STATE_MACHINE.md)
* 🔌 [Contratos de API e WebSockets](./docs/API_CONTRACTS.md)
* 📋 [Board de Desenvolvimento](./PROJECT_BOARD.md)

---

## Como Rodar (Ambiente de Desenvolvimento)

*(Esta seção será atualizada ao final do Setup da Sprint 1)*

```bash
# Clone o repositório
git clone https://github.com/SeuUser/vtt-lite.git
cd vtt-lite

# Instale as dependências raiz (Exige Node.js e Golang)
npm install

# Subir a infra local com Docker (Opcional, caso não use a Cloud)
docker-compose up -d

# Rodar os clientes e servidor
npm run dev
```

---

<p align="center">
Feito com ☕ e muito código na <strong>UTFPR</strong>.
</p>
