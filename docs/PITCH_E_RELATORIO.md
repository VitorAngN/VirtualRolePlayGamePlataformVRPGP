# Pitch e Relatório de Execução

Este documento serve como base para preparar o vídeo de pitch, os slides e o PDF de relatório da entrega da Certificadora de Competência 2.

## Pitch de 5 a 8 Minutos

### 1. Abertura e problema

Nosso projeto está ligado ao contexto do projeto de extensão Lúdico, no setor de RPG. Em uma sessão de RPG de mesa, o Mestre e os jogadores precisam acompanhar muitas informações ao mesmo tempo: mapa, cenas, fichas, pontos de vida, condições, magias, turnos, rolagens de dados e histórico do combate.

Quando tudo isso é controlado manualmente, a sessão fica mais lenta, aumenta a chance de erro e principalmente jogadores iniciantes podem se perder. O problema que buscamos resolver é a sobrecarga operacional durante a sessão de RPG, reduzindo o tempo gasto com controle manual e deixando a experiência mais fluida.

### 2. Pessoas que sofrem com o problema

As pessoas mais afetadas são:

- Mestres de jogo, que precisam organizar a sessão e controlar o estado global;
- jogadores iniciantes, que ainda não dominam todas as regras;
- grupos de RPG em oficinas, eventos e atividades de extensão;
- monitores e organizadores que precisam conduzir partidas de forma acessível.

### 3. Solução proposta

A solução proposta é o VTT Lite, um Virtual Tabletop simplificado para apoiar sessões de RPG. Nesta etapa, desenvolvemos principalmente o frontend desktop do produto.

O protótipo atual possui uma tela de seleção de mundos, uma tela de entrada na sessão e a interface principal do tabuleiro. Na tela principal, o Mestre pode visualizar o mapa com grid, acessar ferramentas laterais, abrir o chat, consultar cenas, criar novas cenas e usar uma barra de macros.

A ideia futura é que essa interface seja conectada em tempo real com um backend por WebSockets e com um companion mobile, para que jogadores possam controlar ficha, vida, recursos e rolagens pelo celular.

### 4. Diferencial

Já existem ferramentas como FoundryVTT e Roll20, mas elas podem ser complexas para grupos iniciantes ou para uso em atividades de extensão. O diferencial do VTT Lite é ser uma proposta mais leve, com uma interface mais direta e pensada para evolução modular.

O objetivo não é competir com ferramentas profissionais completas desde o início, mas criar um produto didático, extensível e alinhado ao problema do projeto: facilitar sessões de RPG, diminuir carga matemática e melhorar a organização visual.

### 5. O que foi implementado

No frontend, implementamos:

- Launcher para escolha de mundos;
- tela de detalhes e entrada na sessão;
- tela principal VTT com grid de mapa;
- toolbar esquerda com ferramentas;
- rail direita com botões de painéis;
- chat lateral com mensagens e rolagens;
- painel de cenas com busca;
- modal de criação e configuração de cenas;
- barra inferior de macros;
- separação em componentes React e CSS Modules.

Também foram iniciados o app mobile companion e a estrutura básica do servidor Go, mas a entrega atual se concentra no protótipo visual e estrutural do frontend.

### 6. Fechamento

Como resultado preliminar, temos um protótipo funcional do frontend que demonstra o fluxo principal do produto: escolher um mundo, entrar na sessão e operar a interface de tabuleiro. O projeto ainda não tem sincronização real em rede, mas a arquitetura foi organizada para permitir essa evolução.

O próximo passo seria conectar o frontend ao backend por WebSockets, implementar persistência de cenas/fichas e integrar o companion mobile para os jogadores.

## Texto Base para o Relatório de Execução

### 1. Introdução

O projeto VTT Lite foi desenvolvido no contexto da disciplina Certificadora de Competência 2, associado ao projeto de extensão Lúdico, com foco no setor de RPG. A proposta é criar um protótipo de plataforma digital para auxiliar sessões de RPG de mesa, reduzindo a sobrecarga de controle manual enfrentada por Mestres e jogadores.

Durante uma sessão de RPG, diversos dados precisam ser acompanhados simultaneamente, como pontos de vida, condições, magias, posições no mapa, turnos e rolagens de dados. Esse controle manual pode gerar atrasos, erros e dificuldade de acompanhamento, especialmente para jogadores iniciantes.

### 2. Objetivo do Produto

O objetivo do VTT Lite é oferecer uma interface digital leve para apoiar sessões de RPG. A proposta de longo prazo é combinar uma aplicação desktop para o Mestre com um companion mobile para os jogadores, permitindo controle de ficha, ações e rolagens em tempo real.

Nesta etapa, o objetivo principal foi construir um protótipo funcional do frontend desktop, demonstrando as telas centrais da experiência do Mestre.

### 3. Escopo Implementado

O desenvolvimento atual se concentrou no frontend desktop. Foram implementadas as seguintes telas e componentes:

- Launcher, responsável pela seleção de mundos/campanhas;
- tela de detalhes do mundo, com entrada na sessão;
- tela principal de tabuleiro virtual;
- toolbar esquerda com ferramentas de mapa;
- rail direita com atalhos para painéis;
- painel de chat lateral;
- painel de cenas;
- modais para criar e configurar cenas;
- barra inferior de macros.

A interface foi organizada em componentes React independentes, cada um com seu arquivo de estilo usando CSS Modules. Essa estrutura facilita manutenção, evolução e apresentação do projeto.

### 4. Tecnologias Utilizadas

As principais tecnologias utilizadas nesta etapa foram:

- React, para construção da interface;
- TypeScript, para tipagem e maior segurança no desenvolvimento;
- Vite, como ferramenta de build e servidor de desenvolvimento;
- CSS Modules, para modularização dos estilos;
- npm Workspaces, para organizar o monorepo;
- Go, em estrutura inicial para o backend.

Embora o projeto tenha uma arquitetura planejada para WebSockets, Tauri, PixiJS e persistência de dados, esses pontos ainda fazem parte da evolução futura e não foram completamente implementados nesta etapa.

### 5. Organização do Frontend

O frontend desktop foi separado em componentes principais:

- `App`: controla a troca entre Launcher e tela VTT;
- `Launcher`: apresenta os mundos e a tela de entrada;
- `VTT`: estrutura a tela principal do tabuleiro;
- `LeftToolbar`: concentra ferramentas do mapa;
- `ChatPanel`: exibe mensagens, cartas e rolagens;
- `ScenesPanel`: exibe e gerencia cenas;
- `MacroBar`: mostra atalhos inferiores;
- `usePanelManager`: controla abertura e fechamento dos painéis laterais.

Essa divisão reduz acoplamento e permite que cada parte da interface evolua separadamente.

### 6. Conceitos da Disciplina

Mesmo que a implementação atual esteja mais concentrada no frontend, a arquitetura planejada do produto considera conceitos importantes de arquitetura de software e Programação Orientada a Objetos.

O padrão Observer aparece como conceito central para a futura sincronização em tempo real: quando o estado da sessão mudar, as interfaces conectadas deverão ser notificadas.

O padrão Command é adequado para representar ações de jogo, como atacar, mover token, rolar dado ou usar item. Cada ação pode ser registrada, validada e futuramente desfeita pelo Mestre.

O padrão State pode ser aplicado ao controle de estados do jogo e condições dos personagens, como exploração, combate, inconsciente, envenenado ou caído.

Os princípios SOLID orientam a separação entre domínio de regras, interface, comunicação em rede e persistência, evitando que a lógica do jogo fique misturada com detalhes visuais.

### 7. Resultados Preliminares

Como resultado preliminar, o projeto possui um protótipo frontend funcional e navegável. É possível abrir a aplicação, selecionar um mundo, entrar na sessão e interagir com a interface principal, incluindo chat, painel de cenas e modais.

O protótipo demonstra a identidade visual e o fluxo principal planejado para o produto. Ele também serve como base para evolução posterior, quando serão adicionadas funcionalidades em tempo real e persistência de dados.

### 8. Limitações Atuais

As principais limitações atuais são:

- ausência de integração real com WebSockets;
- ausência de persistência em banco de dados;
- mapa ainda sem movimentação real de tokens;
- mobile companion ainda em estágio inicial;
- backend ainda apenas estruturado, sem regras completas.

Essas limitações são coerentes com a etapa atual do projeto, que priorizou a construção do protótipo visual e a organização da base frontend.

### 9. Próximos Passos

Os próximos passos planejados são:

- implementar comunicação em tempo real via WebSockets;
- persistir mundos, cenas e fichas;
- integrar o companion mobile;
- implementar movimentação de tokens;
- adicionar regras SRD 5e ao pacote compartilhado;
- evoluir o backend Go para validar eventos e estados da sessão.

## Sugestão de Slides

1. Título: VTT Lite
2. Contexto: projeto Lúdico e RPG
3. Problema: sobrecarga de controle manual
4. Público afetado: Mestre, jogadores e oficinas
5. Solução proposta: Virtual Tabletop Lite
6. Demonstração das telas: Launcher, VTT, Chat, Scenes
7. Implementação frontend: React, TypeScript, Vite, CSS Modules
8. Diferencial: leve, didático, modular e companion-first
9. Estado atual e limitações
10. Próximos passos
