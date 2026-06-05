# Estrutura funcional da aplicacao

Este documento registra a organizacao desejada para o VTT Lite como aplicacao real local, nao como tela de apresentacao.

## Direcao atual

O VTT Lite deve funcionar primeiro como um programa local. O mestre abre o aplicativo, cria um mundo e os dados ficam gravados no disco da maquina, ao lado da aplicacao ou na pasta configurada de saves.

A API Go continua existindo como experimento/base futura para multiplayer, mobile remoto ou sincronizacao, mas nao deve ser o eixo obrigatorio da versao desktop local.

O programa empacotado fica em:

```text
release/VTT Lite-win32-x64/VTT Lite.exe
```

Nesse formato, os saves ficam ao lado do executavel:

```text
release/VTT Lite-win32-x64/saves/
```

## Estado inicial

Ao iniciar o programa sem pasta `saves`, o sistema deve abrir vazio:

- nenhum mundo;
- nenhuma cena;
- nenhum token;
- nenhum asset;
- nenhuma mensagem de chat.
- nenhum sistema cadastrado.

O usuario cria sistemas e mundos manualmente. A partir disso, tudo que for inserido entra no save state do mundo selecionado.

## Regra importante

Dados de exemplo nao devem ficar no runtime principal. Se forem necessarios para apresentacao ou teste visual, devem morar em fixture, script separado ou documento, nunca misturados no seed padrao.

## Fluxo local atual

1. Launcher le a lista de mundos e sistemas do storage local via IPC do Electron.
2. Usuario pode cadastrar sistemas locais na aba `Sistemas`.
3. Usuario cria ou abre um mundo.
4. Ao criar um mundo, deve vincular um sistema ja cadastrado.
5. O programa carrega `world.json` do mundo selecionado.
6. Painel de cenas mostra apenas cenas salvas naquele mundo.
7. Painel de assets grava imagens em `saves/worlds/{worldId}/assets/{assetId}/`.
8. Mapa da cena pode usar um asset local como fundo.
9. Tokens podem ser criados no inspetor ou a partir de assets do tipo `token`.
10. Tokens podem ser movidos no grid e apagados da cena.
11. Chat funciona localmente com scroll, envio de mensagem e rolagem de dados.

## Estrutura de save

```text
saves/
  index.json
  worlds/
    {worldId}/
      world.json
      assets/
        {assetId}/
          arquivo-original.png
```

`index.json` lista os mundos e sistemas existentes. Cada `world.json` concentra metadados do mundo, cenas, assets, tokens e mensagens/eventos.

## Pastas principais

- `apps/desktop-client`: cliente desktop React e shell Electron.
- `apps/mobile-companion`: companion mobile React, planejado para interagir com a mesa depois.
- `server`: API Go opcional/experimental para sincronizacao futura.
- `packages/srd-core`: regras e dominio compartilhado planejado.
- `docs`: documentacao tecnica e academica.

## Proximas funcionalidades de produto

- Persistir chat no `world.json`.
- Criar controle simples de iniciativa.
- Criar modal de edicao de token com HP, CA, nome e imagem.
- Empacotar desktop como executavel instalavel.
- Planejar conexao mobile depois que a base local estiver boa.
