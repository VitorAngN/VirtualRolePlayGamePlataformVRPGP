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
- possui um estado de combate persistido no save do mundo.

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
- `compendium_items`
- `primary_token_attribute`
- `grid`
- `created_at`
- `updated_at`

Regras iniciais:

- fica salvo como pacote local em `saves/systems/{systemId}/system.json`;
- `saves/index.json` guarda apenas o resumo do sistema e o caminho do pacote;
- define manifestos simples de ficha, com tipos de ator, tipos de item e campos;
- pode guardar `compendium_items`, que sao modelos de item do sistema para instanciar em mundos;
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
        "default_value": 10,
        "roll_formula": ""
      }
    ]
  }
]
```

Estrutura inicial de `item_types`:

```json
[
  {
    "id": "weapon",
    "label": "Arma",
    "fields": [
      {
        "id": "damage",
        "label": "Dano",
        "type": "text",
        "section": "Uso",
        "default_value": "1d6",
        "roll_formula": "@damage"
      }
    ]
  }
]
```

Estrutura inicial de `compendium_items`:

```json
[
  {
    "id": "espada_longa",
    "type": "weapon",
    "name": "Espada longa",
    "quantity": 1,
    "equipped": false,
    "data": {
      "damage": "1d8",
      "damage_type": "cortante"
    }
  }
]
```

Tipos de campo aceitos na 0.1:

- `text`
- `number`
- `textarea`
- `checkbox`

`roll_formula` e opcional. Quando preenchido, define uma rolagem segura para aquele campo, por exemplo `1d20 + @str.mod`.

`section` agrupa campos na ficha. No desktop e no mobile, cada secao distinta pode virar uma aba de ficha. Exemplos atuais: `Identidade`, `Combate`, `Atributos`, `Salvaguardas`, `Pericias`, `Acoes`, `Inventario`, `Magias`, `Tracos` e `Notas`.

O criador visual de sistemas ja salva multiplos `actor_types` e `item_types`, com import/export de JSON. Os itens reais criados dentro do mundo consomem esses tipos de item e ficam persistidos em `world.json`. Itens do mundo podem ser salvos como modelos no compendio do sistema, e o painel de itens consegue instanciar esses modelos no mundo ativo.

Campos de item com `roll_formula` viram acoes clicaveis quando o item esta anexado a uma ficha. Campos numericos com prefixos declarativos sao tratados como efeitos quando o item esta equipado/ativo:

- `bonus_*`: soma ao campo alvo, por exemplo `bonus_ac` ou `bonus_str`;
- `set_*`: define o campo alvo quando o valor nao for zero;
- `min_*`: aplica minimo ao campo alvo quando o valor nao for zero;
- `max_*`: aplica maximo ao campo alvo quando o valor nao for zero;
- `multiply_*`: multiplica o campo alvo quando o valor for diferente de `0` e `1`;
- `armor_class`: define uma CA base minima em armaduras equipadas.

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
- `companion_permissions`
- `created_at`
- `updated_at`

Regras iniciais:

- `type` aponta para um tipo definido em `GameSystem.actor_types`;
- `data` guarda os valores dos campos definidos no manifesto do sistema;
- campos legados como `hp`, `max_hp`, `ac`, `level`, `class_name` e `notes` podem existir para compatibilidade;
- a aba de atores renderiza a ficha a partir do manifesto do sistema do mundo.
- a ficha mobile renderiza abas a partir das secoes dos campos do manifesto.
- `companion_permissions` guarda permissoes mobile persistidas por jogador/ficha.

Itens anexados ao ator aparecem nas abas de ficha:

- armas, armaduras e equipamentos em `Inventario`;
- magias em `Magias`;
- condicoes/efeitos em `Tracos`.

Estrutura de `companion_permissions`:

```json
[
  {
    "id": "companion_permission_abc",
    "player_name": "Jogador",
    "permissions": {
      "view_actor": true,
      "adjust_hp": true,
      "roll": true,
      "patch_actor": false,
      "chat": false
    },
    "updated_at": "2026-06-06T12:00:00.000Z"
  }
]
```

## Item

Representa um documento de item criado dentro de um mundo.

Campos principais:

- `id`
- `world_id`
- `actor_id`
- `type`
- `name`
- `data`
- `equipped`
- `quantity`
- `created_at`
- `updated_at`

Regras iniciais:

- `type` aponta para um tipo definido em `GameSystem.item_types`;
- `data` guarda os valores dos campos definidos no manifesto do item;
- `actor_id` e opcional: vazio significa item solto no mundo, preenchido significa item anexado a uma ficha;
- `equipped` marca se o item esta equipado/ativo para efeitos simples;
- condicoes sao consideradas ativas quando anexadas, mesmo sem `equipped`;
- apagar uma ficha solta seus itens de volta para o mundo.
- a ficha desktop permite criar item direto em `Inventario`, `Magias` ou `Tracos`, ja anexando ao ator aberto.

Estrutura exemplo:

```json
{
  "id": "item_abc",
  "world_id": "world_abc",
  "actor_id": "actor_abc",
  "type": "weapon",
  "name": "Espada longa",
  "quantity": 1,
  "equipped": true,
  "data": {
    "attack_bonus": 5,
    "damage": "1d8+3",
    "bonus_attack_bonus": 0,
    "description": ""
  }
}
```

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
- `actor_id`
- `item_id`
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
- `actor_id` e opcional e vincula o token a uma ficha arrastada para a cena.
- `item_id` e opcional e permite representar item/documento solto na cena.
- `hidden` prepara o futuro controle de visibilidade do mestre.
- quando uma ficha ou item e apagado, os tokens deixam de apontar para o documento removido.

## Combat

Representa o controle de encontro/turnos do mundo.

Campos principais:

- `id`
- `world_id`
- `scene_id`
- `active`
- `round`
- `turn`
- `combatants`

Regras iniciais:

- fica persistido em `world.json`;
- `active` indica se o encontro esta iniciado;
- `round` e `turn` controlam a ordem atual;
- `scene_id` aponta para a cena onde o encontro esta acontecendo;
- pausar a mesa com Space e uma trava de sessao/interface por enquanto, nao o mesmo estado do combate.

## Combatant

Representa um token real participando do combate.

Campos principais:

- `id`
- `token_id`
- `scene_id`
- `actor_id`
- `name`
- `initiative`
- `defeated`
- `hidden`
- `sort`
- `created_at`
- `updated_at`

Regras iniciais:

- o combatente sempre nasce a partir de um token existente na cena;
- `actor_id` e opcional e acompanha o token quando ele estiver vinculado a uma ficha;
- itens continuam sendo documentos do mundo e nao precisam estar anexados a jogador/personagem;
- apagar token ou cena remove os combatentes relacionados;
- atualizar nome/ator/oculto do token sincroniza o combatente;
- a ordenacao usa iniciativa quando existir e `sort` como desempate.

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

## CompanionSession

Representa uma conexao temporaria de celular criada pelo desktop.

Campos principais:

- `token`
- `world_id`
- `actor_id`
- `player_name`
- `permissions`
- `created_at`

Regras iniciais:

- fica em memoria no processo Electron;
- aponta para uma unica ficha;
- nao edita o save diretamente;
- envia eventos para o desktop validar e salvar;
- permissoes atuais: `view_actor`, `adjust_hp`, `roll`, `patch_actor` e `chat`;
- a sessao temporaria usa as permissoes persistidas na ficha quando elas existem para o jogador.

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

Na 0.1, o chat ja e persistido no `world.json`. Mensagens criadas pelo desktop e pelo companion mobile entram na mesma lista.

## Snapshot

`WorldSnapshot` junta o estado inicial que o desktop precisa carregar:

- mundo;
- sistema vinculado;
- cenas;
- assets;
- atores;
- itens;
- estado de combate;
- mensagens de chat;
- tokens agrupados por cena.

Esse formato evita o frontend fazer muitas chamadas ao abrir uma mesa.
