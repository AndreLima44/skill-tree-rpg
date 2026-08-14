# Livro de Regras V4

## O que mudou

- `rules/` é a fonte única de verdade com 314 entradas estruturadas.
- `rules-bundle.js` agora é gerado automaticamente a partir da base modular; não contém mais regras demo.
- Para reconstruir o bundle: `node scripts/build-rules-bundle.mjs`.
- Busca normaliza acentos, remove palavras de baixa relevância e entende frases naturais.
- Aliases conceituais ajudam buscas como `desviar`, `pontos de magia` e `comprar habilidade`.
- Perguntas frequentes recebem peso alto no ranking.
- Busca aproximada (fuzzy) é usada como fallback para erros como `ressonansia`.
- Consultas de efeito dão mais peso a regras/condições que descrevem o efeito procurado.
- O primeiro resultado vira uma **Resposta Rápida** com resumo, mecânicas principais e relacionados.
- Resultados secundários exibem o motivo da correspondência.
- Relações são agrupadas visualmente em regras, condições, habilidades, classes, trilhas e elementos.
- O contexto do personagem pode ser usado apenas como pequeno desempate de relevância.

## Exemplos

- `como funciona esquiva` -> Esquiva
- `desviar` -> Esquiva
- `reduzir dano` -> RD — Redução de Dano
- `pontos de magia` -> PR — Pontos de Ressonância
- `como comprar habilidade` -> PR — Pontos de Ressonância
- `o que reduz movimento` -> Lento
- `ressonansia` -> busca aproximada para Ressonância
- `habilidades que usam congelado` -> prioriza o tópico de combo/relação com Congelado

## Manutenção

Edite apenas os arquivos de `rules/*.js`. Depois execute:

```bash
node scripts/build-rules-bundle.mjs
```

O site continua carregando `rules-bundle.js` para funcionar também quando aberto via `file://`, mas esse arquivo é um artefato gerado e não deve ser editado manualmente.
