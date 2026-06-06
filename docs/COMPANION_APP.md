# Arquitetura: Mobile Companion App

## Visao

O companion mobile e uma segunda tela para jogadores. Ele nao substitui o desktop e nao salva o mundo sozinho. O PC do mestre continua sendo a instancia principal da mesa.

A primeira versao deve funcionar em rede local:

1. Mestre abre o `VTT Lite.exe`.
2. Mestre abre um mundo.
3. Mestre cria/abre uma ficha.
4. Mestre gera um link mobile para aquela ficha.
5. Desktop inicia um servidor local embutido.
6. Jogador abre a URL no celular.
7. Celular consulta a ficha vinculada pelo token da sessao.

## Estado atual 0.1

O desktop ja hospeda o companion mobile por HTTP local.

Fluxo implementado:

1. Na aba de atores, clicar em `Celular` em uma ficha existente.
2. O Electron sobe o servidor local do companion, se ainda nao estiver rodando.
3. O mestre define nome do jogador e permissoes da sessao.
4. O desktop cria um token temporario em memoria para aquela ficha.
5. O modal mostra QR Code, links de rede local e `127.0.0.1`.
6. O companion abre com `?token=...` e busca `/api/companion/session/:token`.
7. A ficha mobile renderiza os campos reais do `system.json` e os valores reais do `world.json`.
8. O mobile envia eventos reais para ajustar PV, editar campos, rolar dados e mandar chat, respeitando permissoes.
9. O desktop salva os eventos no `world.json` e atualiza ficha/chat na janela aberta.

Agora ha WebSocket dedicado em `/api/companion/session/:token/ws`. O HTTP continua existindo como fallback para enviar acoes, mas o estado vivo da ficha/chat e recebido pelo socket.

## Papel do desktop

O desktop e o host da sessao:

- le e grava `world.json`;
- guarda mapas, tokens e retratos no disco local;
- calcula rolagens oficiais da mesa;
- valida permissao de jogador;
- distribui atualizacoes para os clientes conectados.

## Papel do mobile

O mobile envia acoes e recebe estado:

- consultar ficha vinculada;
- alternar entre modo de uso e modo de edicao quando a sessao permite editar;
- navegar pelas abas da ficha geradas a partir das secoes dos campos do sistema;
- rolar dados rapidos quando a sessao permite;
- rolar campos da ficha que possuem `roll_formula` no manifesto do sistema;
- ajustar PV quando a sessao permite;
- editar campos da ficha quando a sessao permite `patch_actor`;
- enviar mensagem de chat quando a sessao permite `chat`;
- receber alteracao de HP, campos da ficha e historico de rolagem via WebSocket.

O mobile nao acessa a pasta de saves e nao edita arquivos locais diretamente.

## Conexao local

Exemplo de URL gerada pelo desktop:

```text
http://192.168.0.25:5188/?token=session_xyz
```

O QR Code carrega essa URL. O token identifica a sessao e limita as permissoes.

## Rede externa

Rede externa fica para uma fase posterior. Caminhos possiveis:

- abrir porta manualmente no roteador;
- tunel opcional, como Cloudflare Tunnel;
- relay publico apenas para eventos WebSocket, sem hospedar assets pesados.

A prioridade e rede local estavel. A tela de QR Code ja aceita uma URL externa/tunel opcional, mas ela so funciona se essa URL apontar para o host mobile do programa em execucao.

## Eventos iniciais

```json
{
  "type": "actor.roll",
  "payload": {
    "label": "Forca",
    "formula": "1d20 + @str.mod"
  }
}
```

Eventos previstos:

- `chat.message.create`
- `actor.roll`
- `actor.patch`
- `actor.hp.adjust`
- `token.move`
- `scene.activate`
- `initiative.update`

## Interface planejada

- Status: PV, CA, condicoes e recursos principais.
- Abas: cada valor de `section` nos campos do sistema vira uma aba mobile, por exemplo `Identidade`, `Combate`, `Atributos`, `Inventario`, `Magias` e `Notas`.
- Modo usar: campos com `roll_formula` funcionam como botoes de rolagem.
- Modo editar: a mesma ficha permite editar os valores no lugar, sem trocar para outro formulario.
- Acoes: ataques, testes, magias e itens favoritos.
- Dados: teclado de d4, d6, d8, d10, d12, d20 e d100.
- Chat: mensagens e historico de rolagens.

## Proximos passos

- Separar inventario/itens como entidades reais do sistema, e nao apenas campos de texto.
- Permitir que cada sistema defina layouts mais ricos de ficha alem das secoes basicas.
- Definir permissao por usuario permanente quando existir login/usuarios do mundo.
- Projetar acesso externo assistido, sem depender de configuracao manual de roteador.
