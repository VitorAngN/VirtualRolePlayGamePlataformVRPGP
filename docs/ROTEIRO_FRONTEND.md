# Roteiro de Apresentação do Frontend

Este roteiro foi pensado para uma apresentação de 5 a 8 minutos, com foco no frontend atual do VTT Lite. A ideia é mostrar o produto de forma honesta: o que já funciona visualmente, como a interface foi organizada e como isso se conecta com a proposta futura do sistema.

## Objetivo da Apresentação

Mostrar que o grupo não fez apenas telas soltas, mas sim um protótipo navegável de um Virtual Tabletop, com fluxo de uso, componentes separados, identidade visual e base preparada para evoluir para tempo real.

## Divisão Sugerida Entre Duas Pessoas

Pessoa 1:

- apresenta o problema;
- apresenta a proposta;
- mostra o Launcher e a entrada no mundo;
- contextualiza o usuário Mestre.

Pessoa 2:

- mostra a tela principal VTT;
- explica componentes técnicos do frontend;
- mostra chat, cenas, modais e macro bar;
- fecha com limitações e próximos passos.

## Roteiro Completo com Tempo

### 0:00 - 0:40 | Abertura

Fala sugerida:

> Nosso projeto se chama VTT Lite, uma plataforma de apoio para sessões de RPG de mesa. Ele foi pensado dentro do contexto do projeto de extensão Lúdico, no setor de RPG, onde existe a necessidade de tornar as sessões mais organizadas e acessíveis, principalmente para jogadores iniciantes e para Mestres que precisam controlar muita informação ao mesmo tempo.

Complemento:

> Nesta entrega, nosso foco foi desenvolver o frontend desktop do produto, ou seja, a interface principal usada pelo Mestre durante uma sessão.

Tela a mostrar:

- README no GitHub ou primeira tela do app.

### 0:40 - 1:30 | Problema

Fala sugerida:

> Em uma sessão de RPG, o Mestre precisa acompanhar mapa, cenas, fichas, pontos de vida, condições, turnos, rolagens e histórico do combate. Quando isso é feito manualmente, a sessão fica mais lenta e aumenta a chance de erro.

> Esse problema afeta principalmente o Mestre, que concentra a organização da partida, e jogadores iniciantes, que ainda não dominam todas as regras e podem se perder com várias informações ao mesmo tempo.

Pontos importantes:

- controle manual gera erro;
- excesso de informação reduz imersão;
- ferramentas existentes podem ser complexas para oficinas e grupos iniciantes.

### 1:30 - 2:10 | Solução Proposta

Fala sugerida:

> A solução proposta é um Virtual Tabletop Lite. A ideia é centralizar a experiência do Mestre em uma interface desktop, com acesso rápido ao tabuleiro, chat, cenas e ferramentas de sessão.

> Futuramente, esse frontend poderá se conectar a um backend por WebSockets e a um companion mobile, para que os jogadores controlem ficha, vida e rolagens pelo celular. Mas, nesta etapa, o foco foi criar o protótipo funcional do frontend.

Importante:

- deixar claro que o tempo real é planejamento futuro;
- reforçar que o protótipo atual já demonstra o fluxo principal.

### 2:10 - 3:00 | Demonstração do Launcher

Tela a mostrar:

- abrir o app no navegador;
- mostrar a tela inicial com mundos/campanhas.

Fala sugerida:

> Aqui temos o Launcher, que é a tela inicial do produto. Ele simula a seleção de mundos ou campanhas. Essa escolha é importante porque, em um VTT real, cada mundo teria suas cenas, personagens, fichas e configurações.

> A tela foi construída como um componente React separado chamado `Launcher`, com CSS Module próprio. Isso ajuda a manter o código organizado e facilita alterações visuais sem afetar o restante da aplicação.

O que clicar:

1. mostrar os cards de mundo;
2. clicar em um mundo;
3. abrir a tela de detalhes.

### 3:00 - 3:40 | Tela de Detalhes do Mundo

Tela a mostrar:

- tela com título do mundo, formulário de entrada, detalhes e descrição.

Fala sugerida:

> Depois de escolher um mundo, o usuário entra na tela de detalhes. Aqui simulamos a entrada na sessão como Mestre ou jogador. Essa tela representa uma etapa intermediária antes do tabuleiro principal.

> Mesmo sendo um protótipo, ela já ajuda a demonstrar o fluxo de navegação: selecionar campanha, entrar na sessão e abrir o ambiente principal.

O que clicar:

1. mostrar select de perfil;
2. mostrar campo de senha;
3. clicar em `Join Game Session`.

### 3:40 - 4:40 | Tela Principal VTT

Tela a mostrar:

- tabuleiro com grid;
- toolbar esquerda;
- rail direita;
- macro bar inferior.

Fala sugerida:

> Esta é a tela principal do VTT. Ela representa o espaço de jogo do Mestre. O centro da tela é reservado para o mapa, com um grid visual, que futuramente poderá receber tokens, imagens de mapas e movimentação em tempo real.

> Na lateral esquerda temos a toolbar com ferramentas de mapa: token, medição, desenho, tiles e iluminação. Na lateral direita temos uma rail com atalhos para painéis, como chat e cenas. Na parte inferior temos a macro bar, que simula atalhos rápidos para ações frequentes.

Explicação técnica curta:

> Essa tela foi separada no componente `VTT`, que organiza a composição dos outros componentes: `LeftToolbar`, `ChatPanel`, `ScenesPanel` e `MacroBar`.

### 4:40 - 5:40 | Chat Lateral

O que clicar:

- abrir o botão de chat na rail direita;
- mostrar mensagens;
- mostrar dados;
- enviar uma mensagem rápida ou rolar um dado.

Fala sugerida:

> O chat lateral simula o histórico da sessão. Ele pode exibir mensagens narrativas, cartas de ação e resultados de rolagens de dados. Em um VTT real, essa área é essencial para registrar o que aconteceu durante a sessão.

> No frontend, o chat já possui estado local em React. Ao clicar nos dados, ele cria uma nova mensagem de rolagem. Ao enviar texto, a mensagem entra no histórico.

Ponto técnico:

> Também foi tratado um problema visual importante: ao alternar rapidamente entre painéis laterais, poderia aparecer uma faixa de painel antigo. Esse comportamento foi corrigido no gerenciamento de estado e no CSS de transição.

### 5:40 - 6:40 | Painel de Cenas

O que clicar:

- fechar/trocar para o painel de cenas;
- mostrar lista de cenas;
- usar busca se quiser;
- clicar em `Create Scene`;
- abrir modal de criação;
- depois mostrar configuração de cena.

Fala sugerida:

> O painel de cenas representa a organização dos mapas ou ambientes de uma campanha. Em uma sessão real, o Mestre pode alternar entre taverna, estrada, masmorra, combate e outros cenários.

> Implementamos uma lista de cenas com busca e também modais para criação e configuração. Esses modais ainda não persistem em banco, mas já demonstram a estrutura visual e o fluxo esperado do produto.

Ponto técnico:

> A lógica de abertura dos painéis é controlada pelo hook `usePanelManager`, separando regra de interface do componente visual. Isso melhora a manutenção e evita duplicação de estado.

### 6:40 - 7:20 | Organização Técnica do Frontend

Fala sugerida:

> A organização do frontend foi feita em componentes React independentes. O `App` controla qual tela está ativa. O `Launcher` cuida da seleção de mundos. O `VTT` compõe a tela principal. Cada painel e barra tem seu próprio componente e seu próprio CSS Module.

> Isso segue uma ideia de baixo acoplamento: cada parte da interface tem responsabilidade própria. Essa estrutura permite que, no futuro, a gente conecte dados reais sem precisar reescrever toda a tela.

Mostrar no editor ou GitHub:

- `src/components/Launcher.tsx`;
- `src/components/VTT.tsx`;
- `src/components/ChatPanel.tsx`;
- `src/components/ScenesPanel.tsx`;
- `src/hooks/usePanelManager.ts`.

### 7:20 - 8:00 | Limitações e Próximos Passos

Fala sugerida:

> O projeto ainda está em fase de protótipo. A principal entrega atual é o frontend funcional e navegável. Ainda não temos integração real com WebSockets, persistência em banco de dados ou movimentação real de tokens.

> Os próximos passos seriam conectar o frontend ao backend, implementar sincronização em tempo real, persistir cenas e fichas e evoluir o companion mobile para que jogadores possam interagir pelo celular.

Fechamento:

> Mesmo assim, o resultado atual já demonstra o conceito central do produto: uma interface leve para apoiar sessões de RPG, reduzir sobrecarga do Mestre e organizar melhor a experiência de jogo.

## Ordem Exata da Demonstração

1. Abrir o app no navegador.
2. Mostrar o Launcher.
3. Clicar em um mundo.
4. Mostrar a tela de detalhes.
5. Clicar em `Join Game Session`.
6. Mostrar o tabuleiro.
7. Explicar toolbar esquerda.
8. Explicar rail direita.
9. Abrir chat.
10. Rolar um dado ou enviar mensagem.
11. Abrir painel de cenas.
12. Abrir modal `Create Scene`.
13. Mostrar modal de configuração de cena.
14. Mostrar rapidamente a estrutura de arquivos no GitHub/editor.
15. Fechar falando limitações e próximos passos.

## Frases Para Não Se Complicar

Use:

> Nesta etapa, o foco foi o protótipo frontend.

> A integração em tempo real está planejada na arquitetura, mas ainda não foi concluída.

> Os dados atuais são mockados para demonstrar o fluxo visual.

> A prioridade foi construir uma base componentizada e navegável.

Evite:

> O sistema já sincroniza tudo em tempo real.

> O backend já está completo.

> Já temos banco de dados funcionando.

> O Tauri e o PixiJS já estão implementados.

## Perguntas Prováveis da Professora

### O que está pronto de fato?

Resposta:

> O frontend desktop está navegável e componentizado. Temos Launcher, entrada na sessão, tela principal do tabuleiro, chat, painel de cenas, modais e macro bar.

### O que ainda falta?

Resposta:

> Falta integrar com backend em tempo real, persistir dados, movimentar tokens no mapa e finalizar o companion mobile.

### Qual o diferencial?

Resposta:

> A proposta é ser mais leve e didática do que ferramentas completas como FoundryVTT e Roll20, com foco em reduzir sobrecarga para Mestres e facilitar uso em atividades de extensão.

### Onde entram os conceitos da disciplina?

Resposta:

> Na arquitetura planejada usamos conceitos como Observer para atualização em tempo real, Command para representar ações de jogo, State para estados de combate e condições, além de separação de responsabilidades no frontend por componentes.

### Por que usar React?

Resposta:

> Porque React facilita a construção de interfaces componentizadas e reativas. Como a aplicação tem vários painéis independentes, estado local e telas que mudam conforme a interação, React ajuda a organizar e evoluir o frontend.

## Roteiro Curto Para Gravar Vídeo

> Olá, nosso projeto é o VTT Lite, um protótipo de Virtual Tabletop para apoiar sessões de RPG no contexto do projeto de extensão Lúdico.

> O problema que buscamos resolver é a sobrecarga de controle manual durante partidas de RPG. O Mestre precisa acompanhar mapa, fichas, vida, condições, cenas e rolagens. Isso pode deixar a sessão mais lenta e gerar erros, principalmente com jogadores iniciantes.

> Nossa solução é uma interface desktop para o Mestre, com foco em organizar a sessão em uma tela centralizada. Nesta etapa, desenvolvemos o frontend do produto.

> Aqui temos o Launcher, onde o usuário escolhe um mundo ou campanha. Ao clicar em um mundo, abrimos a tela de detalhes, que simula a entrada na sessão. Depois, entramos na tela principal do VTT.

> A tela principal possui o tabuleiro com grid, uma barra de ferramentas à esquerda, uma rail de atalhos à direita e uma barra de macros na parte inferior. O chat lateral registra mensagens e rolagens, enquanto o painel de cenas organiza os mapas da campanha.

> Tecnicamente, o frontend foi feito com React, TypeScript, Vite e CSS Modules. A interface foi separada em componentes como Launcher, VTT, ChatPanel, ScenesPanel, LeftToolbar e MacroBar. Também criamos um hook para controlar a abertura dos painéis laterais.

> O diferencial do projeto é propor uma ferramenta mais leve e didática do que VTTs completos, pensada para grupos de RPG em contexto de extensão e para evolução futura com companion mobile.

> O que temos hoje é um protótipo frontend navegável. Ainda falta implementar sincronização em tempo real, persistência de dados, movimentação real de tokens e integração com backend. Como próximos passos, pretendemos conectar o frontend via WebSockets e evoluir o companion mobile.

> Assim, o VTT Lite já demonstra o fluxo principal do produto e serve como base para transformar a ideia em uma plataforma real de apoio a sessões de RPG.
