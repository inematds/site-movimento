# FALHAS — site-movimento

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 2026-10-08 | `agnes.sh` passava a chave da API como argumento do python: ficava visível no `ps` (e saiu numa saída de ferramenta) | chave vai pelo ambiente (`MOTOR_CHAVE`), nunca em argv (kie.sh tinha o mesmo defeito) | infra |
| 2026-10-08 | `agnes.sh` consultava o job em `/v1/agnesapi` (certo: `/agnesapi`) e o envio em PNG base64 estourou 120 s | base sem `/v1` na consulta; imagens em JPEG q92; envio com 300 s | infra |
| 2026-10-08 | refazer o clipe 3 "sem letras" gastou 30 créditos à toa: as letras vinham do kf03 (flux desenhou "Departures" apesar do "no text"), não do clipe | antes de gerar, ampliar e OLHAR o quadro de partida e o de chegada procurando letras; o filme cortou o clipe 2 no quadro 44 e o clipe 3 saiu do quadro limpo | prompt |
| 2026-10-08 | pacote dos críticos mostrava o filme preto enquanto os quadros baixavam do Pages | motor baixa 1 quadro a cada 8 primeiro; canvas invisível até o 1º desenho, pôster (1º quadro) no fundo | infra |
| 2026-10-08 | `capturar.js` devolvia o filme preto no pacote dos críticos | tirar `--enable-gpu --ignore-gpu-blocklist` dos argumentos do Chromium | infra |
| 2026-10-08 | `copiar-base.py` esvaziou o `landing.js` (abrir com 'w' antes de ler) e o News do piloto ficou vazio | ler numa variável antes de abrir para escrita | prompt |
| 2026-10-08 | motor de rolagem travava 150–315 ms na 1ª rolagem (quadros baixados depois da 1ª chamada ficavam sem bitmap) | `ensure()` recalcula a janela também quando `nLoaded` muda | infra |
| 2026-10-08 | loop do painel quase parado (1,5/255) com prompt "flicker softly" | `loop.sh` mede o movimento e avisa < 4/255; prompt pede movimento visível | prompt |
| 2026-10-08 | resumo do Raio-X contava 1 elemento em código (defer roda com readyState interactive, a chave montava antes dos gráficos) | `desenhar()` recalcula o resumo | infra |
| 2026-10-08 | keyframes 2–4 idênticos ao 1 (edição de imagem devolve a referência quando o prompt diz "a câmera andou") | `kf_aproxima.py` (recorta o centro e amplia antes de redesenhar) + `folha_kf.py` marca PARADO | prompt |
