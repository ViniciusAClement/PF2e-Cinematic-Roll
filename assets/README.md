# Cinematic Rolls Assets

Coloque os recursos visuais e sonoros do modulo nas pastas abaixo.

## Pastas

- `backgrounds/`: planos de fundo para dialogos, cenas e resultados.
- `portraits/`: retratos de personagens, inimigos ou participantes.
- `icons/`: icones de pericias, salvamentos, estados e acoes.
- `effects/`: overlays, brilhos, particulas e outros efeitos visuais.
- `audio/`: sons e musicas relacionados as rolagens cinematicas.

## Convencoes

- Use nomes em minusculas, sem espacos e sem acentos.
- Separe palavras com hifens, por exemplo `critical-success.webp`.
- Prefira `webp` para imagens e `mp3` ou `ogg` para audio.
- Use `png` quando a transparencia for necessaria.
- Mantenha variantes com o mesmo prefixo, por exemplo `battle-dark.webp` e `battle-light.webp`.
- Evite substituir arquivos em uso sem atualizar o catalogo em `scripts/assets.js`.

## Recomendacoes de imagem

- Fundos: proporcao 16:9 ou maior, com detalhes importantes longe das bordas.
- Retratos: proporcao 1:1 ou 2:3.
- Icones e efeitos: fundo transparente quando aplicavel.
- Otimize arquivos grandes para evitar carregamentos lentos durante a sessao.

Os arquivos reais podem ser adicionados diretamente nas pastas. O catalogo JavaScript usa caminhos relativos ao modulo e pode ser expandido conforme novos recursos forem entregues.
