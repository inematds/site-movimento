#!/usr/bin/env bash
# Clipes 2-3 do piloto + 1 loop. Cada clipe começa no ÚLTIMO QUADRO REAL do anterior e termina no keyframe seguinte.
set -euo pipefail
cd "$(dirname "$0")"
S=../../../skill/site-movimento; K=$S/motores/kling.sh; FX=$S/scripts/fixacao.py; CS=$S/scripts/cortes.py
export LEDGER=$PWD/ledger.tsv
[ -s clipes/c2.mp4 ] || bash $K clipes/c1.ultimo.png kf/kf03.png "Slow steady dolly forward toward the glass entrance doors of the glowing terminal, the departures board inside grows larger, camera stays at eye level and perfectly centered, one continuous shot, no turning, no cuts." 5 clipes/c2.mp4
python3 $FX clipes/c2.mp4 clipes/c1.ultimo.png kf/kf03.png; python3 $CS clipes/c2.mp4 || true
[ -s clipes/c3.mp4 ] || bash $K clipes/c2.ultimo.png kf/kf04.png "Slow steady dolly forward through the open glass doors into the amber hall toward the huge departures board until it fills the frame, camera stays at eye level and perfectly centered, one continuous shot, no turning, no cuts." 5 clipes/c3.mp4
python3 $FX clipes/c3.mp4 clipes/c2.ultimo.png kf/kf04.png; python3 $CS clipes/c3.mp4 || true
mkdir -p loops
[ -s loops/painel.mp4 ] || bash $K kf/kf04.png kf/kf04.png "Locked-off static camera. The amber flap tiles on the departures board flicker softly and a few tiles flip, warm light breathes gently. The shot ends exactly as it started." 5 loops/painel.mp4
python3 $FX loops/painel.mp4 kf/kf04.png kf/kf04.png; python3 $CS loops/painel.mp4 || true
echo FIM
