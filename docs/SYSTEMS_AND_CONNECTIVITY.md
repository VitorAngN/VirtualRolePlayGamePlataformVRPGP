# Sistemas programaveis e conectividade

Este documento define a direcao tecnica para duas partes centrais do VTT Lite:

- sistemas de jogo configuraveis, parecidos com pacotes de sistema do Foundry;
- conexao entre o programa desktop do mestre e clientes mobile.

## Objetivo

O VTT Lite deve continuar local-first. O mestre abre o programa no PC, cria sistemas, cria mundos, adiciona assets pesados e salva tudo no disco local.

O mobile nao deve ser uma segunda copia independente do mundo. Ele deve agir como companion conectado a uma instancia ativa no PC do mestre.

## Sistema de jogo

Um sistema e um pacote local que ensina o VTT Lite como renderizar fichas, itens, rolagens e regras basicas.

Na versao inicial, um sistema deve ser declarativo:

- manifesto em JSON;
- campos de ficha;
- tipos de ator;
- tipos de item;
- compendios simples de itens prontos;
- formulas de rolagem;
- secoes de UI;
- regras simples de derivacao, como modificador de atributo e bonus de proficiencia.

Nao vamos executar JavaScript livre na 0.1. Isso evita uma camada perigosa e dificil de depurar. Quando a base estiver madura, pode existir uma versao avancada com scripts sandboxados.

O usuario nao precisa escrever JSON para comecar. O launcher possui um criador visual de sistemas que aplica templates, permite adicionar/remover campos, trabalha com multiplos tipos de ator, registra tipos de item e grava o `system.json` automaticamente. O JSON continua sendo o formato interno e o modo avancado de edicao.

Cada campo da ficha pode ter uma formula opcional em `roll_formula`. Quando essa formula existe, o companion mobile pode transformar o campo em botao de rolagem, desde que a sessao tenha permissao de rolar dados.

Cada campo tambem possui uma `section`. Na versao atual, as secoes viram abas da ficha no desktop/mobile. Isso permite que um sistema criado visualmente tenha abas como `Identidade`, `Combate`, `Atributos`, `Inventario`, `Magias`, `Tracos` e `Notas` sem escrever codigo.

O criador visual tambem mostra uma previa simples das abas geradas para o tipo de ator ativo. Essa previa nao substitui a ficha real; ela serve para validar a estrutura antes de salvar o manifesto.

Templates iniciais:

- `D&D 5e Lite`: base d20 com atributos, PV, CA, salvaguardas e pericias;
- `RPG simples`: ficha curta com PV, defesa e notas;
- `Em branco`: ponto de partida minimo para sistemas proprios.

O manifesto passa por validacao antes de ser salvo. A validacao barra:

- sistema sem nome;
- tipo de ator sem rotulo;
- IDs duplicados de tipo de ator;
- ficha sem campos;
- IDs duplicados de campo dentro do mesmo tipo de ator;
- IDs duplicados de tipo de item;
- campos invalidos dentro de tipos de item;
- tipo de campo invalido;
- grid sem distancia valida ou sem unidade.

O launcher permite exportar um sistema para JSON e importar um JSON de sistema. A importacao cria um novo pacote local em `saves/systems/{systemId}/`, validado antes de entrar na lista.

O JSON exportado tambem preserva `compendium_items`, ou seja, modelos de arma, magia, equipamento ou condicao que podem ser instanciados em mundos que usam aquele sistema.

## Estrutura proposta de pacote

```text
systems/
  dnd5e-lite/
    system.json
    assets/
      icon.png
      sheet-bg.png
    templates/
      character.sheet.json
      npc.sheet.json
      item.sheet.json
```

No programa empacotado, esses sistemas ficam em:

```text
saves/systems/{systemId}/
```

O `saves/index.json` mantem a lista resumida de sistemas instalados. Cada pacote guarda o manifesto real em `system.json`. Cada mundo guarda uma copia aplicada do manifesto usado na criacao, para evitar quebrar mundos antigos quando um sistema for atualizado.

## Exemplo de manifesto

```json
{
  "id": "dnd5e-lite",
  "name": "D&D 5e Lite",
  "version": "0.1.0",
  "ruleset": "d20",
  "grid": {
    "distance": 5,
    "units": "ft"
  },
  "actor_types": [
    {
      "id": "character",
      "label": "Personagem",
      "fields": [
        {
          "id": "str",
          "label": "Forca",
          "type": "number",
          "section": "Atributos",
          "default_value": 10,
          "roll_formula": "1d20 + @str.mod"
        }
      ]
    },
    {
      "id": "npc",
      "label": "NPC",
      "fields": [
        {
          "id": "hp",
          "label": "PV",
          "type": "number",
          "section": "Combate",
          "default_value": 10,
          "roll_formula": ""
        }
      ]
    }
  ],
  "item_types": [
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
        },
        {
          "id": "bonus_attack_bonus",
          "label": "Bonus no ataque da ficha",
          "type": "number",
          "section": "Efeitos",
          "default_value": 0
        }
      ]
    }
  ],
  "compendium_items": [
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
  ],
  "rolls": {
    "ability_check": "1d20 + @str.mod",
    "raw_check": "1d20 + @proficiency_bonus"
  }
}
```

## Ficha

A ficha nao deve ser um formulario generico lateral. Ela deve abrir como janela flutuante no canvas.

O modo ativo e o modo editavel usam a mesma tela:

- no modo ativo, clicar em atributo/pericia/salvaguarda executa a rolagem;
- no modo editavel, os mesmos blocos viram campos editaveis no proprio lugar;
- dados livres, como notas, idiomas, sentidos e resistencias, podem ser editados diretamente nos blocos.

No companion mobile, o mesmo principio se aplica em uma tela estreita: o jogador alterna entre `Usar` e `Editar`, e navega pelas abas que vieram das secoes do manifesto do sistema. O criador visual de sistemas mostra uma previa dessas abas para evitar que a ficha fique um bloco unico enorme.

## Motor de formulas

O sistema deve ter um avaliador pequeno e controlado de formulas:

- dados: `1d20`, `2d6`, `1d8+3`;
- referencias atuais: `@str`, `@hp`, `@proficiency_bonus`;
- modificadores atuais de atributo d20: `@str.mod`, `@dex.mod`, `@con.mod`, etc.;
- funcoes seguras como `floor`, `ceil`, `min`, `max` ficam para a proxima etapa;
- sem acesso a arquivo, rede, Electron, Node ou DOM.

Isso permite sistemas programaveis sem abrir execucao arbitraria.

## Itens, inventario e efeitos

O sistema declara tipos de item:

- arma;
- armadura;
- magia;
- talento;
- equipamento;
- condicao.

Na base atual, o mundo ja cria documentos reais de item no `world.json`. O usuario pode criar um item pelo painel direito, editar os campos definidos pelo sistema, anexar o item a uma ficha, equipar/guardar e visualizar esse item dentro da janela da ficha.

Tambem e possivel criar item diretamente pela ficha desktop em modo edicao. O botao da aba atual abre o modal central de item ja anexado ao ator e com um tipo inicial sugerido pelo sistema, por exemplo magia em `Magias` ou condicao em `Tracos`.

O painel de itens tambem le `system.compendium_items`. Um item criado no mundo pode ser salvo como modelo de compendio do sistema, e modelos de compendio podem gerar novos itens reais no `world.json`.

Mapeamento inicial dentro da ficha:

- armas, armaduras e equipamentos aparecem em `Inventario`;
- magias aparecem em `Magias`;
- condicoes/efeitos aparecem em `Tracos`.

Efeitos simples ja existem por convencao declarativa:

- `bonus_ac`, `bonus_str`, `bonus_dex`, `bonus_con`, `bonus_int`, `bonus_wis`, `bonus_cha` somam ao campo correspondente quando o item esta equipado/ativo;
- `bonus_attack_bonus` soma ao campo `attack_bonus`;
- `armor_class` em armaduras equipadas define uma CA base minima;
- `set_*`, `min_*`, `max_*` e `multiply_*` permitem regras declarativas simples sem executar JavaScript;
- campos de item com `roll_formula`, como `@damage`, viram botoes de rolagem na ficha.

O canvas tambem aceita arrastar uma ficha da aba de atores para criar um token persistido com `actor_id`, ou arrastar item para representar o documento na cena com `item_id`.

Ainda falta transformar compendios em colecoes mais ricas com pastas, pacotes compartilhaveis e regras derivadas mais completas.

## Desktop como host

O fluxo principal de conexao deve ser:

1. Mestre abre o `VTT Lite.exe`.
2. Mestre abre um mundo.
3. Mestre gera um link mobile a partir de uma ficha e define permissoes da sessao.
4. Desktop inicia um servidor local embutido.
5. Celular acessa a URL na rede local.
6. Mobile consulta a ficha real pelo token.
7. Mobile envia eventos de PV/rolagem validados pelo desktop.

Exemplo local:

```text
http://192.168.0.25:5188/?token=xyz
```

Na base atual, o servidor embutido serve o build do `apps/mobile-companion` e expoe:

- `GET /api/health`
- `GET /api/companion/session/:token`
- `POST /api/companion/session/:token/events`
- `WS /api/companion/session/:token/ws`
- `GET /api/companion/assets/:worldId/:assetId/:filename`

O token fica em memoria no processo Electron e aponta para uma ficha especifica de um mundo especifico.
Os eventos implementados agora sao `actor.hp.adjust`, `actor.roll`, `actor.patch` e `chat.message.create`. O token tambem guarda permissoes como `view_actor`, `adjust_hp`, `roll`, `patch_actor` e `chat`.

As permissoes escolhidas no modal mobile sao persistidas em `actor.companion_permissions`, dentro do `world.json`, por nome do jogador e ficha. O token da sessao continua temporario, mas a configuracao de acesso nao se perde ao reabrir o mundo.

## Rede externa

Para fora da rede local, existem tres caminhos futuros:

- o usuario abre porta no roteador, mais tecnico e menos amigavel;
- o app usa um tunel opcional, como Cloudflare Tunnel ou recurso parecido;
- existe um relay publico do VTT Lite, apenas para encaminhar WebSocket, sem armazenar assets pesados.

A prioridade inicial e rede local. Rede externa entra depois que o modo local estiver estavel.

Na 0.1, o modal de link mobile tem um campo para URL externa/tunel opcional. Ele nao cria o tunel automaticamente; apenas troca o link/QR Code quando o usuario ja apontou uma URL externa para o host local do programa.

## Eventos do mobile

O mobile nao deve editar `world.json` direto. Ele envia eventos:

```json
{
  "type": "actor.roll",
  "actor_id": "actor_123",
  "action": "skill_check",
  "payload": {
    "skill": "perception"
  }
}
```

O desktop valida, calcula, salva e transmite o resultado.

Eventos principais:

- `[feito-base] chat.message.create`
- `chat.message.delete`
- `[feito-base] actor.roll`
- `[feito-base] actor.patch`
- `token.move`
- `scene.activate`
- `initiative.update`

## Permissoes

Cada conexao mobile deve ter um token de sessao.

Permissoes iniciais:

- mestre: tudo;
- jogador: ver ficha vinculada, rolar dados, editar campos permitidos e mandar chat;
- espectador: ver chat e cena ativa, sem editar.

## Proximas entregas

1. [feito-base] Separar manifestos de sistema em arquivos/pastas reais.
2. [feito-base] Criar modo interno visual para montar sistema sem programar.
3. [feito] Criar import/export de sistema.
4. [feito-base] Criar validador de manifesto.
5. [feito-base] Criar motor de formulas seguro para dados, numeros e referencias simples.
6. [feito-base] Fazer ficha D&D Lite ser renderizada por manifesto, nao hardcoded.
7. [feito-base] Criar servidor local embutido no desktop.
8. [feito-base] Criar tela de conexao mobile por token.
9. [feito] Criar QR Code de conexao.
10. [feito-base] Criar WebSocket de eventos.
11. [feito-base] Permitir edicao mobile de campos da ficha via manifesto.
12. [feito-base] Permitir chat mobile persistido.
13. [feito-base] Gerar abas mobile a partir das secoes dos campos do sistema.
14. [feito-base] Criar import/export de sistema pelo launcher.
15. [feito-base] Criar entidades reais de item no mundo e anexar itens a ficha.
16. [feito-base] Arrastar ator/item para a cena criando token vinculado.
17. Criar conexao externa assistida por tunel.
