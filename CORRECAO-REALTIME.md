# Correcao de atualizacoes em tempo real

- Removido o polling que recarregava a tela de Combate a cada 5 segundos.
- Eventos Realtime de `battles`, `battle_enemies` e `characters` agora usam debounce curto.
- O Combate faz sincronizacao incremental: cabecalho, cards de aliados e cards de inimigos sao atualizados sem reconstruir a pagina inteira.
- A ficha nao chama mais `switchTab('personagem')` ao receber o proprio autosave pelo Realtime.
- Campos remotos da ficha sao atualizados diretamente no DOM e o campo atualmente focado nunca e sobrescrito.
- Animacao `fade-in` nao e reiniciada nas atualizacoes ao vivo.
- Barras de PV/PD mudam suavemente de largura.
