#!/usr/bin/env bash
# Keyframes do filme VERTICAL (celular, 720x1280): cada um é a fatia 9:16 central do keyframe
# horizontal correspondente, redesenhada. Mesmo eixo de câmera e mesmo passo entre keyframes.
set -euo pipefail
cd "$(dirname "$0")"
A=../../../../skill/site-movimento/scripts/kf_aproxima.py
S="Vertical portrait frame. Keep exactly the same composition, colors and lighting as the reference image; only add sharp realistic detail. Cinematic photograph, blue hour, warm amber light, 35mm, eye-level frontal camera, no text, no letters, no numbers, no logos, no people."
g() { [ -s "$2" ] || python3 $A "$1" "$2" "$3 $S" --seed ${SEED:-7} --fator 1 --centro 0.5,${4:-0.5} --largura 720 --altura 1280; }
g ../kf/kf01.png kf01v.png "Modern airport terminal glass facade at dusk seen from the wet tarmac: glowing amber hall behind tall glass, deep blue sky above, reflective wet tarmac with a painted guide line in the foreground."
g ../kf/kf02.png kf02v.png "Closer view of the airport terminal glass facade at dusk: the central glass entrance doors and the glowing amber hall behind them, a large black board hanging inside above the doors, wet tarmac in the foreground."
g ../kf/kf03.png kf03v.png "Standing right in front of the open glass entrance of the terminal: through the doors the quiet amber hall, a huge black board with rows of blank glowing amber flap tiles, polished floor reflecting warm light."
g ../kf/kf04.png kf04v.png "A huge black split-flap board almost filling the frame, rows of blank glowing amber flap tiles without any characters, warm amber terminal light at the edges."
echo FIM
