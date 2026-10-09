# Canal — site-filme-v1 (só acrescentar; nunca reescrever)

Conhecimento do projeto que a compactação perde: fatos descobertos, aprendizados, glossário, armadilhas, onde estão as coisas.
Não é estado da tarefa (isso vai em state/plan/progress). Preencha cedo — o hook avisa na faixa 1 (~50% do contexto).

Formato: `- AAAA-MM-DD HH:MM · fato|aprendizado|glossário|armadilha · texto`


## 2026-10-08 ~21h — fatos medidos
- Kling `kling-video-v3_0` + `--tailImage` funciona em **720p** (o who_am_i diz "requer 1080p", mas o submit aceitou). 5 s 720p sem áudio = **30 créditos**.
- Kling **fixa início e fim**: SSIM robusto 0,994 / 0,911 (controle invertido 0,22). Visualmente idênticos. Serve para cadeia.
- SSIM do ffmpeg em resolução cheia dá ~0,6 no mesmo quadro (ruído redesenhado em cena escura) → falso "não fixa". Usar `scripts/fixacao.py` (320×180, desfoque, janelas 8×8).
- Kling liga `prefer_multi_shots=true` por padrão → pode cortar no meio. `motores/kling.sh` passa false.
- flux2-klein (inemaimg :8000) em modo edição devolve a referência quase igual quando o prompt diz "câmera andou". Solução: `scripts/kf_aproxima.py` (recorta o centro, amplia 1,8×, redesenha detalhes). ~11 s por keyframe.
- Saldo Kling inicial 5255,8.
- 20:35 filme do piloto: 3 clipes Kling 720p, fixação 0,99/0,91 · 0,995/0,967 · 0,997/0,99, 0 cortes; montar 361 quadros 33 MB; continuidade PASSA; suavizar sem picos (Kling v3 não desacelera nas emendas).
- loop "flicker softly" quase parado (1,5/255) → refeito com "row by row flip visibly" = 4,5/255. Total gasto 150 créditos (5 jobs × 30), bate com o ledger e com o saldo.
- Chromium do Playwright NÃO toca H.264 (canPlayType vazio) → reqfail no teste; loop ganhou fonte WebM VP9 (452 KB contra 3 MB do MP4).
- Travada de 150–315 ms na 1ª rolagem = bug do motor de rolagem (janela de bitmaps não recalculava com quadros novos). Corrigido: máx 33–36 ms.
- Peças motion-lab: Haiku 5/5 de 1ª (1–2 rodadas, 27 min, 356k tokens); Opus lote C 4/5 de 1ª (rodape-quebra com erro de JS), 31 min, 267k tokens.
