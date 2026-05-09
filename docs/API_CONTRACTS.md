# Contratos de API (WebSockets e REST)

O VTT Lite utiliza uma arquitetura híbrida. Requisições REST são usadas para obter o estado inicial (Ações CRUD pesadas e lentas), enquanto WebSockets são usados para o fluxo do jogo em tempo real (Rápido, Event-Driven).

---

## 1. REST API (Autenticação e Load Inicial)

As requisições REST são processadas via rotas padrão no Go (ex: usando Fiber ou Gin).

### `GET /api/v1/rooms/:roomId`
Obtém o Snapshot inicial da sala a partir do banco de dados (PostgreSQL/Neon) e atualiza o Cache no Redis, caso a sala tenha acabado de acordar.
**Response (200 OK):**
```json
{
  "roomId": "123-abc",
  "status": "EXPLORATION_MODE",
  "mapBackground": "https://cdn.vttlite.com/maps/dungeon-1.jpg",
  "tokens": [
    { "id": "t1", "type": "player", "x": 5, "y": 5, "hp": 100 },
    { "id": "t2", "type": "enemy", "x": 10, "y": 8, "hp": 30 }
  ]
}
```

---

## 2. WebSockets (O Hub em Tempo Real)

Uma vez que o Desktop ou o Mobile estão conectados na URL `wss://api.vttlite.com/ws/rooms/:roomId`, a comunicação acontece através da troca de mensagens JSON chamadas de "Deltas".

### Estrutura Base das Mensagens (Padrão Command)
Toda mensagem enviada ao servidor possui a seguinte estrutura de interface:
```json
{
  "event": "STRING_DO_EVENTO",
  "payload": { ... } // Dados Dinâmicos
}
```

### Principais Eventos (Client -> Server)

**`MOVE_TOKEN_INTENT`**
Enviado quando o Mestre ou Jogador tenta arrastar uma peça pelo grid.
```json
{
  "event": "MOVE_TOKEN_INTENT",
  "payload": {
    "tokenId": "t1",
    "targetX": 6,
    "targetY": 5
  }
}
```

**`ROLL_DICE_INTENT`**
Enviado pelo Mobile Companion quando o jogador clica em "Rolar Dano".
```json
{
  "event": "ROLL_DICE_INTENT",
  "payload": {
    "diceType": "d20",
    "modifier": 5,
    "reason": "Ataque com Espada"
  }
}
```

### Principais Eventos (Server -> Client Broadcast)

**`STATE_DELTA_APPLIED`**
Enviado pelo Go Server para **todos** os clientes após validar e aplicar um Delta com sucesso no Redis. O Desktop intercepta isso e anima a mudança visual.
```json
{
  "event": "STATE_DELTA_APPLIED",
  "payload": {
    "type": "MOVE_TOKEN",
    "tokenId": "t1",
    "newX": 6,
    "newY": 5
  }
}
```

**`DICE_RESULT_BROADCAST`**
Enviado pelo servidor Go para ativar animações 3D de dados no Canvas do PC e atualizar o log do chat.
```json
{
  "event": "DICE_RESULT_BROADCAST",
  "payload": {
    "playerId": "p1",
    "result": 18,
    "total": 23,
    "reason": "Ataque com Espada"
  }
}
```

## Tratamento de Erros no Socket
Se um jogador (Mobile) enviar um ataque fora do seu turno, o servidor Go emite um evento de rejeição, que o Mobile escuta para disparar um Toast (Aviso Visual) na tela do celular.

```json
{
  "event": "ERROR",
  "payload": {
    "code": "OUT_OF_TURN",
    "message": "Aguarde seu turno para atacar."
  }
}
```
