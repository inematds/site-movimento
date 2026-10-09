#!/usr/bin/env bash
# Loop sem costura: o mesmo quadro no início e no fim, com o motor escolhido.
# Uso: MOTOR=kling scripts/loop.sh <saida.mp4> <imagem.png> "<movimento que volta ao começo>" [segundos=5]
#
# Peça um movimento que VOLTA: "o disco dá uma volta lenta completa", "a luz passa e some",
# "as placas piscam e voltam". Uma viagem não volta ao ponto de partida.
# Se a costura aparecer (fixação < 0,90 no fim), rode scripts/loopfix.py no resultado.
# No site: <video muted playsinline loop autoplay>.
set -euo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
OUT=${1:?uso: loop.sh <saida.mp4> <imagem> "<prompt>" [segundos]}; IMG=${2:?}; PROMPT=${3:?}; SEG=${4:-5}
MOTOR=${MOTOR:-kling}
bash "$AQUI/../motores/$MOTOR.sh" "$IMG" "$IMG" "$PROMPT" "$SEG" "$OUT"
python3 "$AQUI/fixacao.py" "$OUT" "$IMG" "$IMG" || echo "costura visível: python3 $AQUI/loopfix.py $OUT"
python3 "$AQUI/cortes.py" "$OUT"
# Loop que quase não se mexe é dinheiro jogado fora. Medido no piloto: "flicker softly" deu 1,5/255
# de variação média (parado na tela). Abaixo de 4, peça um movimento mais visível.
python3 - "$OUT" <<'PY'
import glob, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image
t = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', sys.argv[1], '-vf', 'fps=4,scale=160:90', f'{t}/q_%03d.png'], check=True)
q = [np.asarray(Image.open(f).convert('L'), float) for f in sorted(glob.glob(f'{t}/q_*.png'))]
v = max(np.abs(x - q[0]).mean() for x in q)
print(f'movimento do loop: {v:.1f}/255' + ('  ← QUASE PARADO: peça um movimento mais visível' if v < 4 else '  ok'))
PY
