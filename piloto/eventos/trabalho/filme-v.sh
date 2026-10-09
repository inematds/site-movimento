#!/usr/bin/env bash
# Filme VERTICAL (celular): 3 clipes Kling 9:16 em cadeia sobre os keyframes de kf-v/.
# O Kling segue a proporção da imagem de entrada (o image_to_video não tem aspect_ratio).
set -euo pipefail
cd "$(dirname "$0")"
S=../../../skill/site-movimento; K=$S/motores/kling.sh; FX=$S/scripts/fixacao.py; CS=$S/scripts/cortes.py
export LEDGER=$PWD/ledger.tsv
N="The black board stays completely blank, with no text, no letters, no numbers, no words, no signs and no logos anywhere. Camera stays at eye level and perfectly centered, one continuous shot, no turning, no cuts."
mkdir -p clipes-v
c() { # <inicio> <fim> <saida> <prompt>
  [ -s "$3" ] || bash $K "$1" "$2" "$4 $N" 5 "$3"
  python3 $FX "$3" "$1" "$2"; python3 $CS "$3" || true
}
c kf-v/kf01v.png kf-v/kf02v.png clipes-v/v1.mp4 "Vertical shot. Slow steady dolly forward across the wet tarmac toward the glowing glass facade of the airport terminal at dusk."
c clipes-v/v1.ultimo.png kf-v/kf03v.png clipes-v/v2.mp4 "Vertical shot. Slow steady dolly forward toward the glass entrance doors of the glowing terminal, the black board inside grows larger."
c clipes-v/v2.ultimo.png kf-v/kf04v.png clipes-v/v3.mp4 "Vertical shot. Slow steady dolly forward through the glass into the amber hall toward the huge black board until its glowing amber flap tiles fill the frame."
echo FIM
