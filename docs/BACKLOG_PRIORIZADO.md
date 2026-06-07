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
- [feito] Criar sistemas locais com manifesto basico de ficha.
- [feito] Bloquear criacao de mundo sem sistema cadastrado.
- [feito] Criar e editar atores usando campos definidos pelo sistema do mundo.
- Criar controle simples de iniciativa.
- [feito-base] Arrastar ator para a cena e criar token vinculado a ficha.
- [feito-base] Vincular token a ator para PV/CA/nome virem da ficha no momento da criacao.
- Controlar token de personagem na cena com permissao por jogador.
- Criar pastas/lista melhorada de atores.
- Diferenciar tipos de ator `Personagem` e `NPC`, com NPC sem link mobile por padrao e controle apenas do mestre.
- [feito-base] Criar painel real de itens do mundo.
- [feito-base] Criar, editar, anexar, equipar e apagar item persistido no `world.json`.
- [feito-base] Mostrar itens anexados dentro da ficha, separados por Inventario/Magias/Tracos.
- [feito-base] Criar item direto pela ficha em modo edicao.
- [feito-base] Arrastar item para a cena e criar token vinculado ao documento.
- [feito-base] Criar compendio simples de itens no manifesto do sistema.

## P2 - Integracao desktop + mobile

- [feito-base] Criar API REST inicial em Go como camada opcional/futura.
- [feito] Persistir mundos, cenas, assets e tokens em storage local do programa.
- [feito-base] Definir servidor local embutido no desktop para hospedar o companion mobile.
- [feito-base] Criar tela de conexao mobile por token/link local.
- [feito] Criar QR Code a partir do link local do companion.
- [feito-base] Criar servidor WebSocket basico.
- [feito-base] Conectar desktop ao WebSocket.
- [feito-base] Conectar mobile ao WebSocket.
- [feito] Enviar rolagem do mobile para o chat do desktop via HTTP local.
- [feito] Enviar alteracao de HP do mobile para o estado da sessao via HTTP local.
- [feito] Permissoes por sessao mobile para ajustar PV e rolar dados.
- [feito] Rolar campos da ficha mobile usando `roll_formula` do sistema.
- [feito-base] Editar campos da ficha pelo mobile quando permitido.
- [feito-base] Alternar ficha mobile entre modo usar e modo editar.
- [feito-base] Gerar abas da ficha mobile a partir das secoes do sistema.
- [feito-base] Enviar chat pelo mobile quando permitido.
- [feito-base] Persistir permissoes mobile por jogador/ficha.
- Visualizar mapa no celular como cliente leve.
- Permitir movimento do token pelo celular respeitando grid/permissao.
- Criar codigo de sala local amigavel.
- Criar tunel/acesso externo assistido.
- Criar usuarios reais do mundo, com login local, papeis e permissoes por ficha/token.

## P3 - Persistencia

- [feito] Definir storage 0.1 em JSON + arquivos locais.
- [feito] Persistir mundos/campanhas.
- [feito] Persistir cenas.
- [feito] Persistir tokens criados pela interface.
- [feito] Upload e listagem de assets.
- [feito] Persistir `background_asset_id` da cena.
- Definir banco de dados para 1.0.
- [feito] Persistir personagens/atores no `world.json`.
- [feito] Persistir historico de chat local no `world.json`.
- [feito-base] Persistir permissoes companion em `actor.companion_permissions`.

## P4 - Regras e motor de jogo

- Expandir `packages/srd-core`.
- Implementar calculo de modificadores.
- Implementar condicoes principais.
- Implementar regras basicas de ataque, dano e teste.
- Criar maquina de estados para exploracao e combate.
- Definir manifestos de itens e compendios locais por sistema.
- Criar sistema inicial `dnd5e-lite` orientado por JSON, sem executar scripts externos.
- [feito-base] Criar estrutura real de pacote em `saves/systems/{systemId}/`.
- [feito-base] Criar modo visual interno para montar sistema por templates e campos.
- [feito-base] Criador visual de sistema com secoes/predefinicoes que viram abas da ficha.
- [feito-base] Criar validador de manifesto de sistema.
- [feito-base] Criar motor seguro de formulas declarativas.
- Fazer ficha D&D Lite ser renderizada por manifesto, nao por campos hardcoded.
- [feito-base] Criador visual com multiplos tipos de ator por sistema.
- [feito-base] Criador visual com tipos de item e campos de item no manifesto.
- [feito-base] Preview simples das abas da ficha no criador de sistema.
- [feito-base] Importar/exportar sistemas em JSON pelo launcher.
- Criar schema de abas/layout do sistema alem do agrupamento simples por `section`.
- [feito-base] Criar entidades reais de item/inventario/magia/condicao dentro do mundo, consumindo `item_types` do sistema.
- [feito-base] Aplicar efeitos simples por convencao `bonus_*`, `set_*`, `min_*`, `max_*`, `multiply_*` e `armor_class`.
- [feito-base] Criar compendios locais por sistema para itens prontos.
- Evoluir compendios para pastas, busca, imagens e importacao de pacotes completos.
- Criar inventario/magias como colecoes com ordenacao, pastas e busca.
- Criar efeitos/condicoes com duracao, escopo, acumulacao e regras derivadas mais completas.
- Criar editor visual de layout da ficha alem de secoes/abas.

## P4.5 - Mapa, visao e paredes

- Criar ferramenta de paredes no canvas.
- Persistir segmentos de parede no `world.json`.
- Bloquear movimento de token quando atravessar parede.
- Permitir que o mestre force atravessar parede.
- Controlar visibilidade de paredes para mestre/jogador.
- Evoluir para iluminacao/visao depois da colisao basica.

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
- Companion mobile conectado por token a ficha real do mundo local.
- Companion mobile com WebSocket para receber ficha/chat vivos.
- Companion mobile com edicao de campos e envio de chat controlados por permissao.
- Companion mobile com abas de ficha geradas pelo sistema e alternancia entre usar/editar.
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
- Sistemas locais com tipos de ator e campos de ficha.
- Aba de atores renderizada a partir do sistema vinculado ao mundo.
- Itens reais do mundo persistidos no `world.json`.
- Painel de itens no desktop com anexar/equipar/apagar.
- Ficha desktop mostrando itens anexados e rolagens de item.
- Ficha desktop criando itens anexados direto pela aba aberta.
- Efeitos declarativos de itens ativos alterando atributos/CA/bonus/minimos/maximos/multiplicadores.
- Drag/drop de atores e itens para criar tokens vinculados na cena.
