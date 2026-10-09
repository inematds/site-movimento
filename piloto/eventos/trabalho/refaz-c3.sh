#!/usr/bin/env bash
# Refaz o clipe 3 sem letras no painel (Kling) e roda o MESMO trecho no Agnes para comparar motores.
# As duas pontas (c2.ultimo.png e kf04.png) já não têm letras: as letras nasciam no meio do clipe.
set -uo pipefail
cd "$(dirname "$0")"
S=../../../skill/site-movimento; FX=$S/scripts/fixacao.py; CS=$S/scripts/cortes.py
export LEDGER=$PWD/ledger.tsv
P="Slow steady dolly forward through the open glass doors into the amber hall toward the huge departures board until it fills the frame. The board is completely blank: plain glowing amber flap tiles only, with no text, no letters, no numbers, no words, no signs and no logos anywhere. Camera stays at eye level and perfectly centered, one continuous shot, no turning, no cuts."
qual=${1:-ambos}
if [ "$qual" != agnes ] && [ ! -s clipes/c3b.mp4 ]; then
  bash $S/motores/kling.sh clipes/c2.ultimo.png kf/kf04.png "$P" 5 clipes/c3b.mp4 && { python3 $FX clipes/c3b.mp4 clipes/c2.ultimo.png kf/kf04.png; python3 $CS clipes/c3b.mp4; } &
fi
if [ "$qual" != kling ] && [ ! -s clipes/c3-agnes.mp4 ]; then
  AGNES_ENV_FILE=${AGNES_ENV_FILE:-$HOME/projetos/wifi/.env} bash $S/motores/agnes.sh clipes/c2.ultimo.png kf/kf04.png "$P" 5 clipes/c3-agnes.mp4 && { python3 $FX clipes/c3-agnes.mp4 clipes/c2.ultimo.png kf/kf04.png; python3 $CS clipes/c3-agnes.mp4; } &
fi
wait; echo FIM
