#!/usr/bin/env bash
# Keyframes 2-4 do piloto por aproximação: cada um é o centro do anterior, ampliado e redesenhado.
# Mira no painel de partidas (centro ~0.5,0.48 no kf01). Pula o que já existe.
set -euo pipefail
cd "$(dirname "$0")"
A=../../../../skill/site-movimento/scripts/kf_aproxima.py
S="Keep exactly the same composition, framing, colors and lighting as the reference image; only add sharp realistic detail. Cinematic photograph, blue hour, warm amber light, 35mm, eye-level frontal camera, no text, no letters, no logos, no people."
[ -s kf02.png ] || python3 $A kf01.png kf02.png "Closer view of the airport terminal glass facade at dusk: the central glass entrance doors and the glowing amber hall behind them, a large black departures board hanging inside above the doors, wet tarmac in the foreground. $S" --fator 1.8 --centro 0.5,0.5
[ -s kf03.png ] || python3 $A kf02.png kf03.png "Standing right in front of the open glass entrance of the terminal: through the doors the quiet amber hall, a huge black departures board hanging in the center with rows of glowing amber flap tiles, polished floor reflecting warm light. $S" --fator 1.8 --centro 0.5,0.47
[ -s kf04.png ] || python3 $A kf03.png kf04.png "A huge black split-flap departures board almost filling the frame, rows of blank glowing amber flap tiles, warm amber terminal light at the edges. $S" --fator 1.8 --centro 0.5,0.45
echo FIM
