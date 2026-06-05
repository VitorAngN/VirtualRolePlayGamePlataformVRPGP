# Memoria de Projeto - VTT Lite

Este arquivo existe para retomar o contexto do projeto rapidamente em novas sessoes.

## Identidade

Nome: VTT Lite.

Repositorio local:

```text
C:\Users\vitor\.gemini\antigravity\scratch\VirtualRolePlayGamePlataformVRPGP
```

Repositorio GitHub:

```text
https://github.com/VitorAngN/VirtualRolePlayGamePlataformVRPGP
```

Projeto academico:

- Certificadora de Competencia 2.
- Projeto de extensao escolhido: Ludico, setor de RPG.
- Integrantes: Joao Vitor Angelim Nogueira e Lucas Qualy.

## Proposta

Criar uma mesa virtual leve para RPG, com tela principal desktop para o mestre e companion mobile para os jogadores.

## Estado atual

Implementado:

- desktop client em React/TypeScript/Vite;
- launcher;
- tela principal do VTT;
- toolbar esquerda;
- rail direita;
- chat lateral;
- painel de cenas;
- painel de assets;
- macrobar inferior;
- tokens visuais selecionaveis e arrastaveis no mapa;
- cena ativa refletida no HUD do mapa;
- launcher carregando mundos reais do save local via Electron IPC;
- desktop conectado ao snapshot local do `world.json`;
- modo programa com Electron;
- empacotamento local Windows em `release/VTT Lite-win32-x64/VTT Lite.exe`;
- atalho criado na Area de Trabalho apontando para o executavel gerado;
- storage local em `saves/index.json` e `saves/worlds/{worldId}/world.json`;
- aba `Sistemas` no launcher, com cadastro local em `saves/index.json`;
- criacao de mundo vinculada opcionalmente a um sistema local;
- assets locais em `saves/worlds/{worldId}/assets/{assetId}/`;
- criacao e exclusao de mundos locais;
- criacao, edicao basica e exclusao de cenas;
- upload e exclusao de assets locais;
- criacao, movimentacao e exclusao de tokens locais;
- criacao de token a partir de asset do tipo `token`;
- upload visual de assets de mapa/token/retrato;
- aplicacao de imagem de mapa como fundo da cena ativa;
- chat local funcional com scroll, envio de mensagem e rolagem;
- ambiente local inicial limpo, sem mundo, sem cena, sem tokens, sem assets e sem chat;
- ambiente local inicial tambem sem sistemas predefinidos;
- macros clicaveis registradas no feed da mesa;
- companion mobile com ficha e rolagens locais;
- estrutura inicial de backend Go mantida como base opcional/futura;
- API REST 0.1 em Go mantida para experimentos de sincronizacao;
- pacote `srd-core` inicial.

Planejado:

- WebSocket real;
- empacotamento desktop como executavel;
- persistencia de chat no `world.json`;
- sincronizacao desktop/mobile;
- Tauri ou Electron empacotado;
- PixiJS ou alternativa para mapa avancado.

## Pontos importantes

- Nao dizer que o tempo real ja esta implementado.
- Nao dizer que Tauri/PixiJS ja estao implementados.
- Nao colocar dados de exemplo no seed padrao do app.
- O desktop local nao deve depender da API Go para abrir ou salvar mundos.
- O programa deve iniciar sem mundo/cena predefinidos.
- O programa deve iniciar sem sistemas predefinidos; sistemas devem ser criados manualmente pelo usuario.
- O empacotamento portatil deve preservar a pasta `saves/` existente.
- Para a apresentacao atual, focar no frontend e no prototipo navegavel.
- O companion mobile e um diferencial importante.
- A documentacao academica precisa separar bem problema, publico, solucao, diferencial, resultados e limitacoes.

## Comandos

Instalar dependencias:

```bash
npm install
```

Rodar desktop:

```bash
npm run dev:desktop
```

Rodar mobile:

```bash
npm run dev:mobile
```

Rodar como programa local:

```bash
npm run program
```

Gerar executavel local:

```bash
npm run package:program
```

Observacao: `npm run dev:program` e apenas modo de desenvolvimento com Vite/localhost.

Rodar API opcional:

```bash
npm run dev:api
```

Validar desktop:

```bash
npm run build --workspace=desktop-client
npm run lint --workspace=desktop-client
```

Validar mobile:

```bash
npm run build --workspace=mobile-companion
npm run lint --workspace=mobile-companion
```

## Arquivos para olhar primeiro

- `README.md`
- `docs/INDEX.md`
- `apps/desktop-client/src/App.tsx`
- `apps/desktop-client/src/components/VTT.tsx`
- `apps/desktop-client/electron/main.cjs`
- `apps/desktop-client/electron/local-store.cjs`
- `apps/mobile-companion/src/App.tsx`
- `server/cmd/api/main.go`
- `server/internal/httpapi/server.go`
- `server/internal/storage/json_store.go`

## Proxima acao recomendada

1. Persistir mensagens do chat no `world.json`.
2. Implementar controle simples de iniciativa no desktop.
3. Melhorar configuracao de token: HP, CA, imagem e nome sem depender de prompt.
4. Criar configuracao mais completa de cena: grid, tamanho e mapa.
