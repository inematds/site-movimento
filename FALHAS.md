# FALHAS — site-movimento

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 2026-10-08 | motor de rolagem travava 150–315 ms na 1ª rolagem (quadros baixados depois da 1ª chamada ficavam sem bitmap) | `ensure()` recalcula a janela também quando `nLoaded` muda | infra |
| 2026-10-08 | loop do painel quase parado (1,5/255) com prompt "flicker softly" | `loop.sh` mede o movimento e avisa < 4/255; prompt pede movimento visível | prompt |
| 2026-10-08 | resumo do Raio-X contava 1 elemento em código (defer roda com readyState interactive, a chave montava antes dos gráficos) | `desenhar()` recalcula o resumo | infra |
| 2026-10-08 | keyframes 2–4 idênticos ao 1 (edição de imagem devolve a referência quando o prompt diz "a câmera andou") | `kf_aproxima.py` (recorta o centro e amplia antes de redesenhar) + `folha_kf.py` marca PARADO | prompt |
