# Contratos de API

Este documento descreve contratos da API Go opcional. A versao desktop local atual nao depende dessa API para abrir, criar mundo ou salvar assets.

O caminho futuro de multiplayer/mobile pode usar uma arquitetura hibrida:

- REST para carregar e persistir estado estrutural: mundos, cenas, tokens e assets.
- WebSocket para eventos em tempo real: movimento, rolagens, chat, turno e HP.

Na versao atual, a base REST 0.1 existe como experimento. WebSocket ainda e proximo passo.

## Desktop local atual

O programa Electron salva e le o estado diretamente em `saves/`, sem depender da API Go para jogar localmente. O preload expõe uma camada de storage com as operacoes reais usadas pelo React.

Operacoes locais ja existentes para combate:

- `addCombatant(sceneId, tokenId)`
- `removeCombatant(combatantId)`
- `patchCombat(worldId, patch)`
- `patchCombatant(combatantId, patch)`

`WorldSnapshot` no desktop local inclui tambem:

- `actors`
- `items`
- `chat_messages`
- `combat`

Esse contrato local deve guiar a futura API REST/WebSocket, em vez de criar um formato paralelo.

## Base local

```text
http://127.0.0.1:8080
```

## Health

```http
GET /health
```

Resposta:

```json
{
  "service": "vtt-lite-api",
  "status": "ok"
}
```

## REST 0.1 implementado

### Mundos

```http
GET /api/v1/worlds
POST /api/v1/worlds
GET /api/v1/worlds/{worldId}/snapshot
```

Criar mundo:

```json
{
  "name": "Campanha de sabado",
  "description": "",
  "system": "D&D 5e SRD"
}
```

Snapshot:

```json
{
  "world": {},
  "scenes": [],
  "assets": [],
  "actors": [],
  "items": [],
  "chat_messages": [],
  "combat": {},
  "tokens_by_scene": {}
}
```

## Cenas

```http
GET /api/v1/worlds/{worldId}/scenes
POST /api/v1/worlds/{worldId}/scenes
PATCH /api/v1/scenes/{sceneId}
```

Criar cena:

```json
{
  "name": "Taverna do Corvo",
  "background_asset_id": "asset_123",
  "grid_size": 40,
  "width": 30,
  "height": 20,
  "active": true
}
```

Atualizar cena:

```json
{
  "name": "Taverna do Corvo - Noite",
  "active": true
}
```

## Tokens

```http
GET /api/v1/scenes/{sceneId}/tokens
POST /api/v1/scenes/{sceneId}/tokens
PATCH /api/v1/tokens/{tokenId}
DELETE /api/v1/tokens/{tokenId}
```

Criar token:

```json
{
  "name": "Sentinela",
  "asset_id": "asset_token",
  "x": 12,
  "y": 8,
  "hp": 18,
  "max_hp": 22,
  "ac": 14,
  "hidden": false
}
```

Mover token:

```json
{
  "x": 13,
  "y": 9
}
```

## Assets

```http
GET /api/v1/assets?worldId={worldId}
POST /api/v1/assets
GET /assets/{assetId}/{filename}
```

Upload usa `multipart/form-data`.

Campos:

- `file`: arquivo.
- `kind`: `map`, `token` ou `portrait`.
- `worldId`: mundo dono do asset.
- `sceneId`: opcional.
- `name`: nome amigavel.

Exemplo:

```bash
curl -F "file=@mapa.png" \
  -F "kind=map" \
  -F "worldId=world_local" \
  -F "name=Mapa da taverna" \
  http://127.0.0.1:8080/api/v1/assets
```

## WebSocket planejado

URL futura:

```text
ws://127.0.0.1:8080/ws/worlds/{worldId}
```

### Mensagem base

```json
{
  "event": "EVENT_NAME",
  "payload": {}
}
```

### Client -> Server

Mover token:

```json
{
  "event": "MOVE_TOKEN_INTENT",
  "payload": {
    "tokenId": "token_123",
    "targetX": 6,
    "targetY": 5
  }
}
```

Rolar dado:

```json
{
  "event": "ROLL_DICE_INTENT",
  "payload": {
    "formula": "1d20+5",
    "reason": "Ataque com espada"
  }
}
```

### Server -> Clients

Estado aplicado:

```json
{
  "event": "STATE_DELTA_APPLIED",
  "payload": {
    "type": "MOVE_TOKEN",
    "tokenId": "token_123",
    "x": 6,
    "y": 5
  }
}
```

Resultado de dado:

```json
{
  "event": "DICE_RESULT_BROADCAST",
  "payload": {
    "playerId": "player_1",
    "formula": "1d20+5",
    "total": 23,
    "reason": "Ataque com espada"
  }
}
```

Erro:

```json
{
  "event": "ERROR",
  "payload": {
    "code": "OUT_OF_TURN",
    "message": "Aguarde seu turno para agir."
  }
}
```
