#!/usr/bin/env bash
# Pacote de imagens para os críticos: capturas da página no desktop (1440×900) e no celular (390×844),
# mais folhas de contato < 100 KB cada, para o crítico ver a página inteira em poucas imagens.
# Os críticos julgam ESTES pixels, nunca o código.
#
# Uso: scripts/pacote-criticos.sh <nome-da-peça> <url> [pasta=$TRABALHO/criticos/<nome>]
set -uo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
N=${1:?uso: pacote-criticos.sh <nome> <url> [pasta]}; U=${2:?}
D=${3:-${TRABALHO:-$PWD}/criticos/$N}
rm -rf "$D"; mkdir -p "$D"
node "$AQUI/capturar.js" "$U" "$D/desk" 1440x900 2>&1 | tail -1
node "$AQUI/capturar.js" "$U" "$D/cel" 390x844 2>&1 | tail -1
python3 - "$D" <<'PY'
import glob, os, sys
from PIL import Image
D = sys.argv[1]
for d in ('desk', 'cel'):
    fs = sorted(glob.glob(f'{D}/{d}/s_*.jpg'))
    tw, th, cols = ((480, 300, 5) if d == 'desk' else (195, 422, 8))
    por = cols * 3
    for parte in range(0, len(fs), por):
        sub = fs[parte:parte + por]
        c = Image.new('RGB', (cols * tw, ((len(sub) + cols - 1) // cols) * th), (20, 20, 20))
        for k, f in enumerate(sub):
            im = Image.open(f).convert('RGB'); im.thumbnail((tw, th)); c.paste(im, ((k % cols) * tw, (k // cols) * th))
        out = f'{D}/{d}_folha{parte // por}.jpg'; q = 72
        c.save(out, quality=q)
        while os.path.getsize(out) > 98000 and q > 35:
            q -= 8; c.save(out, quality=q)
        if os.path.getsize(out) > 98000:
            c.thumbnail((int(c.width * .8), int(c.height * .8))); c.save(out, quality=q)
        print(out, os.path.getsize(out) // 1024, 'KB')
PY
