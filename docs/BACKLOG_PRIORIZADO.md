# Backlog Priorizado

Este backlog organiza o que falta por prioridade realista para o VTT Lite.

## P0 - Ambiente funcional limpo

- Revisar responsividade do desktop client em notebooks menores.
- Revisar companion mobile em viewport estreito.
- Garantir que chat e painel de cenas nao criem glitch visual quando clicados rapidamente.
- [feito] Melhorar estados vazios dos paineis principais.
- [feito] Remover dados mockados do runtime principal.
- [feito] Iniciar sem mundo, cena, token, asset ou chat predefinido.
- [feito] Ajustar docs para a decisao local-first.

## P1 - Produto minimo jogavel

- [feito] Criar token visual no mapa.
- [feito] Permitir selecionar e mover token no grid.
- [feito] Registrar rolagens de macros no chat.
- [feito] Permitir trocar cena ativa pelo painel lateral.
- [feito] Carregar snapshot local no desktop.
- [feito] Listar assets do mundo em painel lateral.
- [feito] Enviar asset de mapa/token pela interface.
- [feito] Aplicar imagem de mapa como fundo da cena ativa.
- [feito] Chat local com scroll e envio de mensagem.
- [feito] Criar cena persistente pelo painel lateral.
- [feito] Apagar mundo local.
- [feito] Apagar cena local.
- [feito] Apagar asset local.
- [feito] Criar token pela interface.
- [feito] Persistir token criado no `world.json`.
- [feito] Criar token a partir de asset do tipo `token`.
- [feito] Apagar token local.
- Criar controle simples de iniciativa.

## P2 - Integracao desktop + mobile

- [feito-base] Criar API REST inicial em Go como camada opcional/futura.
- [feito] Persistir mundos, cenas, assets e tokens em storage local do programa.
- Criar servidor WebSocket basico.
- Conectar desktop ao WebSocket.
- Conectar mobile ao WebSocket.
- Enviar rolagem do mobile para o chat do desktop.
- Enviar alteracao de HP do mobile para o estado da sessao.
- Criar codigo de sala ou QR Code simulado.

## P3 - Persistencia

- [feito] Definir storage 0.1 em JSON + arquivos locais.
- [feito] Persistir mundos/campanhas.
- [feito] Persistir cenas.
- [feito] Persistir tokens criados pela interface.
- [feito] Upload e listagem de assets.
- [feito] Persistir `background_asset_id` da cena.
- Definir banco de dados para 1.0.
- Persistir personagens.
- Persistir historico de chat ou eventos importantes.

## P4 - Regras e motor de jogo

- Expandir `packages/srd-core`.
- Implementar calculo de modificadores.
- Implementar condicoes principais.
- Implementar regras basicas de ataque, dano e teste.
- Criar maquina de estados para exploracao e combate.

## P5 - Entrega final

- Empacotar desktop com Electron.
- Criar build do mobile como PWA.
- Adicionar testes basicos.
- Criar pipeline CI.
- Gerar materiais finais de apresentacao.

## Feito ate agora

- Monorepo com apps e pacote compartilhado.
- Desktop client em React.
- Mobile companion em React.
- Componentizacao do desktop.
- Hook de painel lateral.
- Protótipo de chat, cenas, toolbar e macrobar.
- Protótipo de ficha mobile com rolagens e historico local.
- Modo programa local com Electron.
- Storage local em `saves/`.
- Backend Go inicial mantido como base opcional/futura.
- Upload e entrega local de assets.
- Painel de assets no desktop.
- Imagem de mapa aplicada como fundo de cena.
- Tokens visuais selecionaveis e arrastaveis no grid do desktop.
- Tokens criados/apagados pela interface e salvos no disco.
- Macros clicaveis com rolagens registradas no chat.
- Cena ativa refletida no HUD do mapa.
