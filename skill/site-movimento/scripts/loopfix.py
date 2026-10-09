#!/usr/bin/env python3
"""Fecha a costura de um loop quando o primeiro quadro não bate com o último.

Uso: loopfix.py <loop.mp4> [min_quadros=48]
Acha o quadro k (depois do início) mais parecido com o ÚLTIMO e recodifica o clipe como k..fim,
para a volta do fim ao começo ficar invisível. Sobrescreve e guarda o original em <nome>.orig.mp4.
Saída sem áudio (-an).
"""
import sys, subprocess, os, shutil, tempfile
import numpy as np
from PIL import Image

if len(sys.argv) < 2:
    sys.exit('uso: loopfix.py <loop.mp4> [min_quadros=48]')
f = sys.argv[1]; minlen = int(sys.argv[2]) if len(sys.argv) > 2 else 48
fps_s = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=r_frame_rate',
                        '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or '24/1'
a, b = (fps_s.split('/') + ['1'])[:2]; fps = round(float(a) / float(b or 1))
tmp = tempfile.mkdtemp(prefix='loopfix_')
try:
    subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', 'scale=160:-2', f'{tmp}/f_%04d.png'], check=True)
    fr = sorted(os.listdir(tmp)); n = len(fr)
    if n <= minlen + 1:
        sys.exit(f'clip has {n} frames, need more than {minlen + 1}')
    arr = lambda i: np.asarray(Image.open(os.path.join(tmp, fr[i])).convert('L'), dtype=np.float32)
    last = arr(n - 1)
    def score(i): d = arr(i) - last; return float(np.mean(d * d))
    base = score(0)
    best = min((score(i), i) for i in range(0, n - minlen))
    print(f'primeiro x último: mse {base:.1f}; melhor quadro de início {best[1]} mse {best[0]:.1f}')
    if best[1] == 0 or best[0] > base * 0.8:
        print('mantido como está'); sys.exit(0)
    k = best[1]
    src = f.replace('.mp4', '.orig.mp4'); os.replace(f, src)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f"select='gte(n\\,{k})',setpts=N/{fps}/TB", '-r', str(fps),
                    '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', f], check=True)
    print(f'cortado para os quadros {k}..{n - 1} ({n - k} quadros), original em {src}')
finally:
    shutil.rmtree(tmp, ignore_errors=True)
