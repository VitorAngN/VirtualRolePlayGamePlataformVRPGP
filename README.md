# VTT Lite - Virtual Tabletop Lite

> Status: protótipo frontend funcional, com arquitetura planejada para tempo real  
> Disciplina: Certificadora de Competência 2 - Engenharia de Computação  
> Autores: João Vitor Angelim Nogueira e Lucas Qualy  
> Projeto de extensão escolhido: Lúdico, setor de RPG

## Sobre o Projeto

O VTT Lite é um protótipo de plataforma de apoio para sessões de RPG de mesa. A proposta é oferecer uma interface digital para o Mestre do Jogo acompanhar mundos, cenas, chat, rolagens e elementos de tabuleiro em uma tela centralizada.

Nesta etapa, o foco principal do desenvolvimento foi o frontend desktop: uma interface inspirada em Virtual Tabletops como FoundryVTT e Roll20, mas com uma proposta mais leve e direcionada para uso didático, apresentação e evolução incremental do produto.

## Problema

Em sessões de RPG, principalmente em campanhas com várias pessoas, o Mestre e os jogadores precisam controlar muitas informações ao mesmo tempo: fichas, pontos de vida, condições, magias, mapa, cenas, turnos e rolagens de dados.

Quando esse controle é feito manualmente, surgem problemas comuns:

- perda de tempo com cálculos e consultas durante a sessão;
- erros no acompanhamento de vida, condições ou recursos;
- excesso de janelas e informações espalhadas;
- dificuldade para novos jogadores acompanharem o estado do jogo;
- menor imersão por causa da carga operacional do sistema.

## Pessoas Impactadas

O público principal são grupos de RPG vinculados ao projeto de extensão Lúdico, incluindo:

- Mestres de jogo, que precisam organizar a sessão e controlar o estado global;
- jogadores iniciantes, que podem se perder com regras e fichas complexas;
- participantes de atividades de extensão, oficinas ou eventos;
- monitores e organizadores que precisam apresentar uma experiência mais acessível.

## Solução Proposta

A solução proposta é um Virtual Tabletop Lite, com uma interface desktop para o Mestre e, como evolução planejada, um companion mobile para os jogadores.

O frontend atual já apresenta:

- tela inicial para seleção de mundos/campanhas;
- tela de detalhes do mundo e entrada na sessão;
- tabuleiro visual com grid;
- barra de ferramentas lateral esquerda;
- rail lateral direita com atalhos;
- painel de chat com mensagens, cartas e rolagens;
- painel de cenas com busca e lista de mapas;
- modal de criação e configuração de cenas;
- barra inferior de macros.

## Diferencial

Ferramentas como FoundryVTT e Roll20 já resolvem parte desse problema, mas costumam ser completas demais para grupos pequenos, iniciantes ou contextos de oficina. O diferencial do VTT Lite é propor uma experiência mais simples e objetiva, pensada para:

- reduzir a sobrecarga visual;
- separar a tela principal do Mestre do controle individual dos jogadores;
- permitir evolução futura para tempo real com WebSockets;
- manter uma arquitetura organizada em componentes, facilitando manutenção e apresentação acadêmica.

## Estado Atual da Implementação

O projeto está em fase de protótipo. A parte mais avançada é o desktop client em React.

Implementado até agora:

- estrutura em monorepo com workspaces npm;
- aplicação desktop em React, TypeScript e Vite;
- layout componentizado em `Launcher`, `VTT`, `LeftToolbar`, `ChatPanel`, `ScenesPanel` e `MacroBar`;
- CSS Modules para isolar estilos por componente;
- hook `usePanelManager` para controlar painéis laterais;
- protótipo inicial de app mobile companion;
- servidor Go inicial com modelos de domínio.

Ainda planejado:

- integração real com WebSockets;
- persistência de campanhas, cenas e fichas;
- regras SRD 5e completas;
- movimentação de tokens no mapa;
- sincronização com companion mobile;
- empacotamento desktop com Tauri;
- motor gráfico com PixiJS ou biblioteca equivalente para renderização avançada do mapa.

## Tecnologias Utilizadas

Nesta etapa:

- React 19;
- TypeScript;
- Vite;
- CSS Modules;
- npm Workspaces;
- Go, ainda em estrutura inicial de backend.

Tecnologias planejadas para evolução:

- WebSockets para comunicação em tempo real;
- Tauri para empacotamento desktop;
- PixiJS ou alternativa WebGL para o tabuleiro;
- banco de dados para persistência;
- Redis ou mecanismo equivalente para estado de sessão em tempo real.

## Organização do Repositório

```text
vtt-lite/
  apps/
    desktop-client/      # Frontend principal do tabuleiro
    mobile-companion/    # Protótipo do companion mobile
  packages/
    srd-core/            # Regras compartilhadas do sistema SRD
  server/
    cmd/api/             # Entrada do servidor Go
    internal/domain/     # Modelos de domínio
  docs/                  # Documentação de arquitetura e apoio
```

## Como Rodar o Frontend

Instale as dependências:

```bash
npm install
```

Execute o desktop client:

```bash
npm run dev:desktop
```

Ou diretamente pelo workspace:

```bash
npm run dev --workspace=desktop-client
```

O Vite mostrará a URL local, normalmente:

```text
http://localhost:5173/
```

## Validação

Comandos usados para validar o frontend:

```bash
npm run build --workspace=desktop-client
npm run lint --workspace=desktop-client
```

## Documentação de Apoio

- [Arquitetura do Sistema](./ARCHITECTURE.md)
- [Companion App](./docs/COMPANION_APP.md)
- [Máquina de Estados](./docs/STATE_MACHINE.md)
- [Contratos de API](./docs/API_CONTRACTS.md)
- [Board de Desenvolvimento](./PROJECT_BOARD.md)
