# Mobile Companion

Protótipo mobile do VTT Lite pensado para o jogador acompanhar a própria ficha durante a sessão.

## O que já existe

- cabeçalho com personagem, sala e estado de sincronização;
- controle de pontos de vida e PV temporário;
- abas de ações, magias, inventário e perícias;
- rolagem de ataques, dano, testes e dados livres;
- controle simples de espaços de magia;
- histórico local das últimas ações.

## Como rodar

```bash
npm run dev --workspace=mobile-companion
```

URL local padrão:

```text
http://localhost:5188/
```

## Validação

```bash
npm run build --workspace=mobile-companion
npm run lint --workspace=mobile-companion
```
