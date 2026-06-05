# Backend 0.1 - Fundacao Funcional

Este documento descreve a primeira versao funcional do backend do VTT Lite. A prioridade e permitir que o produto deixe de ser apenas mock visual e comece a armazenar mundos, cenas, tokens e assets.

## Objetivo da versao 0.1

- Ter uma API REST local funcional.
- Persistir metadados em JSON.
- Armazenar arquivos de mapas/tokens em disco.
- Servir assets por URL.
- Permitir que desktop e mobile consumam o mesmo estado no futuro.
- Preparar uma migracao futura para PostgreSQL + storage S3/R2 sem trocar o contrato do frontend.

## Como rodar

Pelo repositorio raiz:

```bash
npm run dev:api
```

Ou direto na pasta do servidor:

```bash
cd server
go run ./cmd/api
```

Variaveis:

```bash
PORT=8080
VTT_DATA_DIR=data
```

## Rotas principais

Health:

```http
GET /health
```

Mundos:

```http
GET /api/v1/worlds
POST /api/v1/worlds
GET /api/v1/worlds/{worldId}/snapshot
```

Cenas:

```http
GET /api/v1/worlds/{worldId}/scenes
POST /api/v1/worlds/{worldId}/scenes
PATCH /api/v1/scenes/{sceneId}
```

Tokens:

```http
GET /api/v1/scenes/{sceneId}/tokens
POST /api/v1/scenes/{sceneId}/tokens
PATCH /api/v1/tokens/{tokenId}
DELETE /api/v1/tokens/{tokenId}
```

Assets:

```http
GET /api/v1/assets?worldId={worldId}
POST /api/v1/assets
GET /assets/{assetId}/{filename}
```

## Upload de asset

`POST /api/v1/assets` usa `multipart/form-data`.

Campos:

- `file`: arquivo enviado.
- `kind`: `map`, `token` ou `portrait`.
- `worldId`: mundo dono do asset.
- `sceneId`: opcional, quando o asset pertence a uma cena especifica.
- `name`: nome amigavel.

Exemplo conceitual:

```bash
curl -F "file=@mapa.png" \
  -F "kind=map" \
  -F "worldId=world_local" \
  -F "name=Mapa da taverna" \
  http://127.0.0.1:8080/api/v1/assets
```

## Limites intencionais da 0.1

- Sem login/autenticacao.
- Sem WebSocket real ainda.
- Sem banco relacional.
- Sem storage remoto.
- Sem permissao por jogador.

Essas ausencias sao aceitaveis para a 0.1 porque o objetivo agora e transformar o prototipo em um produto persistente e testavel.
