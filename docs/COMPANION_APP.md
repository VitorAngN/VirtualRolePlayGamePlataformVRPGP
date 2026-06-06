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
3. O desktop cria um token temporario em memoria para aquela ficha.
4. O modal mostra links de rede local e `127.0.0.1`.
5. O companion abre com `?token=...` e busca `/api/companion/session/:token`.
6. A ficha mobile renderiza os campos reais do `system.json` e os valores reais do `world.json`.
7. O mobile envia eventos reais para ajustar PV e rolar dados.
8. O desktop salva os eventos no `world.json` e atualiza ficha/chat na janela aberta.

Ainda nao ha QR Code, permissao por usuario nem WebSocket dedicado. A sincronizacao atual usa HTTP local com eventos enviados ao processo Electron.

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
- rolar dados;
- editar campos permitidos da ficha;
- enviar mensagem de chat;
- receber alteracao de HP, condicao e historico de rolagem.

O mobile nao acessa a pasta de saves e nao edita arquivos locais diretamente.

## Conexao local

Exemplo de URL gerada pelo desktop:

```text
http://192.168.0.25:5188/?token=session_xyz
```

O QR Code deve carregar essa URL. O token identifica a sessao e limita as permissoes.

## Rede externa

Rede externa fica para uma fase posterior. Caminhos possiveis:

- abrir porta manualmente no roteador;
- tunel opcional, como Cloudflare Tunnel;
- relay publico apenas para eventos WebSocket, sem hospedar assets pesados.

A prioridade e rede local estavel.

## Eventos iniciais

```json
{
  "type": "actor.roll",
  "actor_id": "actor_123",
  "payload": {
    "roll": "skill_check",
    "skill": "perception"
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
- Acoes: ataques, testes, magias e itens favoritos.
- Dados: teclado de d4, d6, d8, d10, d12, d20 e d100.
- Chat: mensagens e historico de rolagens.

## Proximos passos

- Criar QR Code de conexao a partir do link ja gerado.
- Criar WebSocket/event stream de eventos.
- Expandir edicao mobile para campos liberados alem de PV.
- Transformar rolagens de campos da ficha em formulas do sistema.
- Definir permissao por jogador/ficha.
