# Modelo de Dados

Este documento registra as entidades principais do VTT Lite. Ele serve como fonte de verdade para backend, frontend e futuras migracoes de banco.

## World

Representa uma campanha/mundo.

Campos principais:

- `id`
- `name`
- `description`
- `system_id`
- `system`
- `created_at`
- `updated_at`

Relacionamentos:

- possui muitas cenas;
- possui muitos assets;
- possui jogadores.
- pode estar vinculado a um sistema local.

## GameSystem

Representa um conjunto de regras ou sistema de jogo cadastrado pelo usuario.

Campos principais:

- `id`
- `name`
- `ruleset`
- `version`
- `description`
- `actor_types`
- `item_types`
- `primary_token_attribute`
- `grid`
- `created_at`
- `updated_at`

Regras iniciais:

- fica salvo como pacote local em `saves/systems/{systemId}/system.json`;
- `saves/index.json` guarda apenas o resumo do sistema e o caminho do pacote;
- define manifestos simples de ficha, com tipos de ator e campos;
- nao cria mundo, cena, mapa, token ou ator automaticamente;
- pode ser vinculado a um mundo no momento da criacao;
- quando um mundo usa um sistema, o `world.json` tambem guarda o manifesto aplicado;
- sistema em uso por mundo nao pode ser apagado por enquanto.
- apagar um sistema tambem remove a pasta do pacote quando ele nao estiver em uso.

Estrutura inicial de `actor_types`:

```json
[
  {
    "id": "personagem",
    "label": "Personagem",
    "fields": [
      {
        "id": "hp",
        "label": "PV atual",
        "type": "number",
        "section": "Combate",
        "default_value": 10
      }
    ]
  }
]
```

Tipos de campo aceitos na 0.1:

- `text`
- `number`
- `textarea`
- `checkbox`

## Actor

Representa uma ficha criada dentro de um mundo.

Campos principais:

- `id`
- `world_id`
- `system_id`
- `name`
- `type`
- `data`
- `portrait_asset_id`
- `created_at`
- `updated_at`

Regras iniciais:

- `type` aponta para um tipo definido em `GameSystem.actor_types`;
- `data` guarda os valores dos campos definidos no manifesto do sistema;
- campos legados como `hp`, `max_hp`, `ac`, `level`, `class_name` e `notes` podem existir para compatibilidade;
- a aba de atores renderiza a ficha a partir do manifesto do sistema do mundo.

## Scene

Representa um mapa ou ambiente jogavel dentro de um mundo.

Campos principais:

- `id`
- `world_id`
- `name`
- `background_asset_id`
- `grid_size`
- `width`
- `height`
- `active`
- `created_at`
- `updated_at`

Relacionamentos:

- pertence a um mundo;
- pode ter um asset de mapa como fundo;
- possui muitos tokens.

## Asset

Representa um arquivo enviado ao sistema.

Tipos:

- `map`: imagem de mapa/cena;
- `token`: imagem de token;
- `portrait`: retrato de personagem/NPC.

Campos principais:

- `id`
- `world_id`
- `scene_id`
- `kind`
- `name`
- `filename`
- `content_type`
- `size_bytes`
- `url`
- `created_at`

## Token

Representa uma peca posicionada em uma cena.

Campos principais:

- `id`
- `scene_id`
- `asset_id`
- `name`
- `x`
- `y`
- `hp`
- `max_hp`
- `ac`
- `hidden`
- `created_at`
- `updated_at`

Regras iniciais:

- `x` e `y` sao coordenadas de grid.
- `asset_id` e opcional para permitir token sem imagem customizada.
- `hidden` prepara o futuro controle de visibilidade do mestre.

## Player

Representa um usuario conectado ao mundo.

Campos principais:

- `id`
- `name`
- `world_id`
- `is_gm`
- `is_mobile`
- `created_at`

Na 0.1, ainda nao existe autenticacao real.

## ChatMessage

Representa mensagem, rolagem ou evento relevante.

Campos principais:

- `id`
- `world_id`
- `scene_id`
- `speaker`
- `type`
- `content`
- `created_at`

Na 0.1, o chat ainda esta mais forte no frontend. O backend ja reserva o modelo para persistir esse historico depois.

## Snapshot

`WorldSnapshot` junta o estado inicial que o desktop precisa carregar:

- mundo;
- sistema vinculado;
- cenas;
- assets;
- atores;
- mensagens de chat;
- tokens agrupados por cena.

Esse formato evita o frontend fazer muitas chamadas ao abrir uma mesa.
