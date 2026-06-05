# Storage de Assets

O VTT Lite precisa armazenar imagens de mapas, tokens e retratos. Esta parte e essencial para chegar perto da experiencia de um Foundry VTT, onde o mestre monta cenas com arquivos proprios.

## Versao local 0.1

Na 0.1, os assets ficam no disco local do programa:

```text
saves/
  worlds/
    {worldId}/
      world.json
      assets/
        {assetId}/
          mapa.png
```

Metadados ficam no `world.json` do mundo:

```json
{
  "assets": [
    {
      "id": "asset_123",
      "world_id": "world_123",
      "scene_id": "scene_123",
      "kind": "map",
      "name": "Taverna",
      "filename": "taverna.png",
      "content_type": "image/png",
      "size_bytes": 153000,
      "url": "vttlocal://asset/world_123/asset_123/taverna.png"
    }
  ]
}
```

No Electron, arquivos sao carregados pelo protocolo local `vttlocal://`.

## Por que comecar em disco

- Combina com a ideia de programa local.
- Evita hospedagem de arquivos pesados.
- Permite que o mestre controle os proprios mapas/tokens.
- Funciona sem internet.
- E mais simples para uma versao 0.1 real.

## Regras importantes

- O frontend nao deve depender do caminho fisico absoluto do arquivo.
- O app deve usar o `url` salvo no asset.
- Ao apagar um asset, o arquivo em `assets/{assetId}` deve ser removido.
- Ao apagar um asset usado como mapa, a cena deve limpar `background_asset_id`.
- Dados de teste nao devem ser copiados para `saves/`.

## Evolucao futura

Quando existir modo multiplayer/remoto, pode haver outro backend de storage:

- API Go servindo assets;
- pasta compartilhada local;
- Cloudflare R2, S3 ou Supabase Storage;
- import/export de mundos.

Essa evolucao nao deve quebrar o contrato do asset: a UI continua lendo `asset.url`.

## Tipos de asset

- `map`: fundo de cena.
- `token`: imagem usada no grid.
- `portrait`: imagem de personagem ou NPC fora do mapa.

## Proximas tarefas

- [feito] Criar upload visual em painel de assets.
- [feito] Permitir escolher imagem de fundo da cena.
- [feito] Apagar asset local.
- [feito-base] Criar token a partir de asset local do tipo `token`.
- Criar editor para trocar a imagem de um token existente.
- Gerar thumbnails.
- Validar tamanho e tipo de arquivo.
