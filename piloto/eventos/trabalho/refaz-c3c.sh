#!/usr/bin/env bash
# 2ª tentativa do clipe 3: as letras nasciam no kf03 (flux desenhou "Departures" apesar do "no text")
# e o clipe 2 já chegava nelas a partir do quadro ~50. O filme agora corta o clipe 2 no quadro 44
# (painel ainda liso) e o clipe 3 vai dali direto ao kf04, que é limpo.
set -euo pipefail
cd "$(dirname "$0")"
S=../../../skill/site-movimento; export LEDGER=$PWD/ledger.tsv
P="Slow steady dolly forward through the glass facade and into the amber hall toward the huge black departures board until its glowing amber flap tiles fill the frame. The board is completely blank: plain amber tiles only, with no text, no letters, no numbers, no words, no signs and no logos anywhere. Camera stays at eye level and perfectly centered, one continuous shot, no turning, no cuts."
[ -s clipes/c3c.mp4 ] || bash $S/motores/kling.sh clipes/c2.q44.png kf/kf04.png "$P" 5 clipes/c3c.mp4
python3 $S/scripts/fixacao.py clipes/c3c.mp4 clipes/c2.q44.png kf/kf04.png; python3 $S/scripts/cortes.py clipes/c3c.mp4 || true
