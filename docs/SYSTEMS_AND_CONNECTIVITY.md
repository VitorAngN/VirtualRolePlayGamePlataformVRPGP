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
- formulas de rolagem;
- secoes de UI;
- regras simples de derivacao, como modificador de atributo e bonus de proficiencia.

Nao vamos executar JavaScript livre na 0.1. Isso evita uma camada perigosa e dificil de depurar. Quando a base estiver madura, pode existir uma versao avancada com scripts sandboxados.

O usuario nao precisa escrever JSON para comecar. O launcher possui um criador visual de sistemas que aplica templates, permite adicionar/remover campos e grava o `system.json` automaticamente. O JSON continua sendo o formato interno e o modo avancado de edicao.

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
- tipo de campo invalido;
- grid sem distancia valida ou sem unidade.

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
      "sheet": "character.sheet.json"
    },
    {
      "id": "npc",
      "label": "NPC",
      "sheet": "npc.sheet.json"
    }
  ],
  "rolls": {
    "ability_check": "1d20 + @abilities.{ability}.mod",
    "skill_check": "1d20 + @skills.{skill}.total",
    "saving_throw": "1d20 + @saves.{ability}.total"
  }
}
```

## Ficha

A ficha nao deve ser um formulario generico lateral. Ela deve abrir como janela flutuante no canvas.

O modo ativo e o modo editavel usam a mesma tela:

- no modo ativo, clicar em atributo/pericia/salvaguarda executa a rolagem;
- no modo editavel, os mesmos blocos viram campos editaveis no proprio lugar;
- dados livres, como notas, idiomas, sentidos e resistencias, podem ser editados diretamente nos blocos.

## Motor de formulas

O sistema deve ter um avaliador pequeno e controlado de formulas:

- dados: `1d20`, `2d6`, `1d8+3`;
- referencias: `@abilities.str.mod`, `@prof`, `@level`;
- funcoes seguras: `floor`, `ceil`, `min`, `max`;
- sem acesso a arquivo, rede, Electron, Node ou DOM.

Isso permite sistemas programaveis sem abrir execucao arbitraria.

## Itens e compendios

Depois da ficha basica, o sistema deve poder declarar tipos de item:

- arma;
- armadura;
- magia;
- talento;
- equipamento;
- condicao.

Esses itens entram em compendios locais do sistema. O usuario pode arrastar um item para a ficha, e o item altera campos ou cria acoes de rolagem.

## Desktop como host

O fluxo principal de conexao deve ser:

1. Mestre abre o `VTT Lite.exe`.
2. Mestre abre um mundo.
3. Mestre gera um link mobile a partir de uma ficha.
4. Desktop inicia um servidor local embutido.
5. Celular acessa a URL na rede local.
6. Mobile consulta a ficha real pelo token.
7. Na proxima fase, acoes do mobile entram como eventos validados pelo desktop.

Exemplo local:

```text
http://192.168.0.25:5188/?token=xyz
```

Na base atual, o servidor embutido serve o build do `apps/mobile-companion` e expoe:

- `GET /api/health`
- `GET /api/companion/session/:token`
- `POST /api/companion/session/:token/events`
- `GET /api/companion/assets/:worldId/:assetId/:filename`

O token fica em memoria no processo Electron e aponta para uma ficha especifica de um mundo especifico.
Os eventos implementados agora sao `actor.hp.adjust` e `actor.roll`.

## Rede externa

Para fora da rede local, existem tres caminhos futuros:

- o usuario abre porta no roteador, mais tecnico e menos amigavel;
- o app usa um tunel opcional, como Cloudflare Tunnel ou recurso parecido;
- existe um relay publico do VTT Lite, apenas para encaminhar WebSocket, sem armazenar assets pesados.

A prioridade inicial e rede local. Rede externa entra depois que o modo local estiver estavel.

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

- `chat.message.create`
- `chat.message.delete`
- `actor.roll`
- `actor.patch`
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
3. Criar import/export de sistema.
4. [feito-base] Criar validador de manifesto.
5. Criar motor de formulas seguro.
6. Fazer ficha D&D Lite ser renderizada por manifesto, nao hardcoded.
7. [feito-base] Criar servidor local embutido no desktop.
8. [feito-base] Criar tela de conexao mobile por token.
9. Criar QR Code de conexao.
10. Criar WebSocket de eventos.
