# VTT Lite - Virtual Tabletop Lite

> Status: app desktop local em construcao, com frontend funcional e storage em disco  
> Disciplina: Certificadora de Competencia 2 - Engenharia de Computacao  
> Autores: Joao Vitor Angelim Nogueira e Lucas Qualy  
> Projeto de extensao escolhido: Ludico, setor de RPG

## Sobre o projeto

O VTT Lite e uma plataforma de apoio para sessoes de RPG de mesa. A proposta e oferecer uma interface digital para o mestre organizar mundos, cenas, mapas, chat, rolagens e elementos de tabuleiro em uma tela centralizada.

A direcao atual e local-first: o programa deve abrir como um aplicativo no computador, salvar mundos e imagens em disco e nao depender de hospedagem para funcionar.

## Problema

Em sessoes de RPG, o mestre e os jogadores precisam controlar muitas informacoes ao mesmo tempo: fichas, pontos de vida, condicoes, magias, mapa, cenas, turnos e rolagens.

Quando esse controle e manual, surgem problemas comuns:

- perda de tempo com calculos e consultas durante a sessao;
- erros no acompanhamento de vida, condicoes ou recursos;
- excesso de janelas e informacoes espalhadas;
- dificuldade para novos jogadores acompanharem o estado do jogo;
- menor imersao por causa da carga operacional do sistema.

## Pessoas impactadas

O publico principal sao grupos de RPG vinculados ao projeto de extensao Ludico:

- mestres de jogo;
- jogadores iniciantes;
- participantes de oficinas ou eventos;
- monitores e organizadores.

## Solucao proposta

A solucao proposta e um Virtual Tabletop Lite com uma interface desktop para o mestre e, como evolucao planejada, um companion mobile para os jogadores.

O desktop atual ja possui:

- launcher local para mundos/campanhas;
- aba de sistemas locais para cadastrar regras/conjuntos de jogo;
- tabuleiro visual com grid;
- barra de ferramentas lateral esquerda;
- rail lateral direita com paineis;
- painel de chat com mensagens e rolagens;
- painel de cenas;
- painel de assets para mapas, tokens e retratos;
- upload de imagens para o save local;
- aplicacao de mapa como fundo de cena;
- criacao, movimento e exclusao de tokens;
- criacao de token usando imagem enviada como asset;
- barra inferior de macros;
- storage local em `saves/`.

## Diferencial

Ferramentas como Foundry VTT e Roll20 sao completas, mas podem ser pesadas ou complexas para grupos pequenos, iniciantes ou contextos de oficina. O diferencial do VTT Lite e buscar uma experiencia mais simples:

- abrir como programa local;
- salvar mapas/tokens no disco do usuario;
- reduzir sobrecarga visual;
- separar a tela do mestre do futuro companion mobile;
- evoluir de forma incremental para sincronizacao em tempo real.

## Estado atual da implementacao

Implementado:

- monorepo com workspaces npm;
- desktop client em React, TypeScript, Vite e Electron;
- componentes `Launcher`, `VTT`, `LeftToolbar`, `ChatPanel`, `ScenesPanel`, `AssetsPanel` e `MacroBar`;
- CSS Modules;
- hook `usePanelManager`;
- modo programa com Electron;
- storage local em `saves/index.json` e `saves/worlds/{worldId}/world.json`;
- cadastro local de sistemas em `saves/index.json`;
- assets locais em `saves/worlds/{worldId}/assets/{assetId}/`;
- criacao e exclusao de mundos locais;
- vinculo opcional de mundo com sistema local;
- criacao, edicao basica e exclusao de cenas;
- upload, aplicacao e exclusao de assets locais;
- criacao, movimento e exclusao de tokens locais;
- token visual com imagem quando criado a partir de asset do tipo `token`;
- chat local com scroll, envio de mensagem e rolagens;
- companion mobile em React com ficha e rolagens locais;
- servidor Go inicial mantido como camada opcional/futura.

Ainda planejado:

- persistir mensagens do chat no `world.json`;
- editor de token com HP, CA, nome e imagem sem prompt;
- controle simples de iniciativa;
- sincronizacao com companion mobile;
- empacotamento instalavel;
- motor grafico mais robusto para mapa, luz e grid.

## Tecnologias

- React 19;
- TypeScript;
- Vite;
- Electron;
- CSS Modules;
- npm Workspaces;
- Go como backend opcional para experimentos futuros.

## Organizacao do repositorio

```text
vtt-lite/
  apps/
    desktop-client/      # Programa principal: React + Electron
    mobile-companion/    # Companion mobile planejado
  packages/
    srd-core/            # Regras compartilhadas do sistema SRD
  server/
    cmd/api/             # Entrada opcional do servidor Go
    internal/domain/     # Modelos de dominio
  docs/                  # Documentacao tecnica e academica
```

## Como rodar

Instale as dependencias:

```bash
npm install
```

Execute como programa local sem localhost:

```bash
npm run program
```

Esse modo compila o frontend e abre uma janela Electron carregando os arquivos locais de `dist/`.

Para gerar uma pasta com `.exe`:

```bash
npm run package:program
```

O executavel fica em:

```text
release/VTT Lite-win32-x64/VTT Lite.exe
```

Importante: no build portatil, a pasta inteira `release/VTT Lite-win32-x64/` e o programa. Nao mova apenas o `.exe` para outro lugar, porque ele precisa das DLLs e da pasta `resources/` que ficam ao lado. Use o atalho da Area de Trabalho ou abra o `.exe` dentro dessa pasta.

Nesse modo, os saves ficam ao lado do executavel:

```text
release/VTT Lite-win32-x64/saves/
```

Durante desenvolvimento rapido, tambem existe:

```bash
npm run dev:program
```

Esse comando usa Vite por baixo e pode aparecer como `127.0.0.1`; ele nao e a versao final do programa.

No modo local do repositorio, os saves ficam em:

```text
saves/
```

Para rodar apenas no navegador durante desenvolvimento visual:

```bash
npm run dev:desktop
```

Para rodar o companion mobile:

```bash
npm run dev:mobile
```

Para rodar a API opcional:

```bash
npm run dev:api
```

## Validacao

Comandos usados para validar:

```bash
npm run lint --workspace=desktop-client
npm run build --workspace=desktop-client
npm run build --workspace=mobile-companion
npm run lint --workspace=mobile-companion
```

## Documentacao de apoio

- [Indice da documentacao](./docs/INDEX.md)
- [Backlog priorizado](./docs/BACKLOG_PRIORIZADO.md)
- [Memoria de projeto](./docs/MEMORIA_PROJETO.md)
- [Arquitetura do Sistema](./ARCHITECTURE.md)
- [Estrutura funcional](./docs/APP_STRUCTURE.md)
- [Storage de assets](./docs/ASSET_STORAGE.md)
- [Contratos de API opcionais](./docs/API_CONTRACTS.md)
- [Board de Desenvolvimento](./PROJECT_BOARD.md)
