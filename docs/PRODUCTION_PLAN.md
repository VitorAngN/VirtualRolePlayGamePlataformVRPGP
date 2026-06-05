# Plano de Producao

Este documento define como sair do "so roda no navegador de desenvolvimento" para um programa local utilizavel.

## Meta 0.1 funcional

Uma 0.1 funcional precisa permitir:

- abrir o VTT Lite como programa local;
- iniciar sem mundo, sistema, cena ou dados falsos;
- cadastrar e apagar sistemas locais;
- criar e apagar mundos;
- vincular mundo obrigatoriamente a um sistema local;
- criar, editar e apagar cenas;
- enviar e apagar assets de mapa/token/retrato;
- aplicar um mapa local como fundo de cena;
- criar, mover e apagar tokens;
- criar token usando uma imagem salva como asset;
- manter tudo salvo em `saves/`;
- reabrir o programa e recuperar o save.

## Arquitetura 0.1

```text
Electron app -> React UI -> IPC -> Local store -> saves/
```

Persistencia:

```text
saves/
  index.json
  worlds/
    {worldId}/
      world.json
      assets/
        {assetId}/
          arquivo.png
```

`index.json` armazena a lista de mundos e a lista de sistemas locais. O empacotador portatil deve preservar a pasta `saves/` existente quando gerar uma nova versao.

## Empacotamento

O caminho inicial e empacotar o desktop Electron sem servidor web local:

- build do React com Vite;
- Electron apontando para `dist/index.html`;
- pasta `saves/` criada ao lado do executavel em build empacotado;
- build portavel para Windows em `release/VTT Lite-win32-x64/`.

Comando:

```bash
npm run package:program
```

Saida:

```text
release/
  VTT Lite-win32-x64/
    VTT Lite.exe
    saves/
      index.json
    resources/
      app/
        dist/
        electron/
```

No build portatil, a pasta `VTT Lite-win32-x64/` inteira deve ser mantida junta. O `.exe` sozinho nao carrega o app, porque depende de `resources/`, DLLs do Electron e da pasta `saves/`.

O comando `npm run dev:program` continua existindo somente para desenvolvimento rapido com Vite/localhost. Ele nao representa a entrega local final.

## API e mobile

A API Go deixa de ser requisito da 0.1 local. Ela fica como camada opcional para uma fase posterior:

- WebSocket;
- companion mobile sincronizado;
- modo servidor local ou remoto;
- exportacao/importacao de mundos.

## Riscos

- Misturar dados falsos no runtime principal.
- Apagar assets sem confirmar.
- Nao validar tipo/tamanho de arquivo.
- Acoplar o desktop local a uma API antes da base estar boa.
- Nao ter migracao caso o formato de `world.json` mude.

## Proximas tarefas tecnicas

1. Persistir mensagens do chat no `world.json`.
2. Criar controle simples de iniciativa.
3. Melhorar configuracao de token: HP, CA, nome e imagem sem prompt.
4. Melhorar configuracao de cena: grid, largura, altura e mapa.
5. Evoluir sistemas para guardar configuracoes de ficha, dados e regras.
6. Gerar thumbnails dos assets.
7. Criar instalador ou atalho com icone proprio.
8. Testar abrir, fechar e reabrir recuperando o mesmo save.
