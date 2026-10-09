#!/usr/bin/env python3
"""Tira o tranco das emendas do filme (<site>/film/master.mp4, gravado pelo montar.py).

Uso: suavizar.py <pasta-do-site>

Por que o tranco aparece mesmo com os quadros fixados certinhos: cada clipe desacelera ao chegar no
quadro final e acelera ao sair do quadro inicial do seguinte. A câmera para por alguns quadros e
depois dá um pulo; na rolagem isso vira um soluço em cada emenda.

Em cada pico (mudança entre quadros vizinhos > 4× a mediana local) remove os quadros parados dos
dois lados e insere quadros intermediários com compensação de movimento (ffmpeg minterpolate, mci),
para o passo ficar constante. Grava film/master_smooth.mp4, refaz frames/ (1280 px, q6) e atualiza
frames/manifest.json. Olhe os intermediários: em vãos muito grandes (> 14 quadros) o minterpolate
pode borrar detalhe fino.
"""
import sys, os, subprocess, glob, json, shutil, tempfile
import numpy as np
from PIL import Image
if len(sys.argv) < 2:
    sys.exit('uso: suavizar.py <pasta-do-site>   (precisa de film/master.mp4 e frames/manifest.json)')
site = sys.argv[1]; os.chdir(site)
W = tempfile.mkdtemp(prefix='suavizar_'); os.makedirs(W + '/all'); os.makedirs(W + '/out')
subprocess.run(['ffmpeg', '-v', 'error', '-i', 'film/master.mp4', '-vf', 'scale=1280:-2', '-q:v', '2', f'{W}/all/f_%04d.png'], check=True)
files = sorted(glob.glob(f'{W}/all/f_*.png'))
small = lambda p: np.asarray(Image.open(p).convert('L').resize((160, 90)), dtype=np.float32)
S = [small(f) for f in files]
d = np.array([np.abs(S[i + 1] - S[i]).mean() for i in range(len(S) - 1)])
def local_med(i, r=10):
    lo, hi = max(0, i - r), min(len(d), i + r + 1)
    w = np.delete(d[lo:hi], i - lo); return float(np.median(w))
spikes = [i for i in range(len(d)) if d[i] > 4 * max(local_med(i), 0.3)]
print('picos em', spikes, [round(float(d[i]), 1) for i in spikes])
out = []
i = 0; jn = 0
spike_set = set(spikes)
while i < len(files):
    if i in spike_set:
        # i -> i+1 é o tranco: volta sobre a parada e avança sobre a saída lenta
        med = local_med(i)
        k = 0
        while k < 6 and i - k - 1 >= 0 and d[i - k - 1] < 0.5 * med: k += 1
        m = 0
        while m < 4 and i + 1 + m < len(d) and d[i + 1 + m] < 0.5 * med: m += 1
        a, b = i - k, i + 1 + m
        # descarta os quadros parados já incluídos (a+1 .. i)
        out = out[:len(out) - k]
        gap = np.abs(S[b] - S[a]).mean()
        n = int(max(2, min(14, round(gap / max(med, 0.5)) - 1)))
        pair = f'{W}/pair{jn}'; os.makedirs(pair, exist_ok=True)
        shutil.copy(files[a], f'{pair}/p_1.png'); shutil.copy(files[b], f'{pair}/p_2.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-framerate', '1', '-i', f'{pair}/p_%d.png', '-vf',
                        f'tpad=stop_mode=clone:stop_duration=1,minterpolate=fps={n + 1}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1', f'{pair}/m_%03d.png'], check=True)
        mids = sorted(glob.glob(f'{pair}/m_*.png'))[1:n + 1]   # pula a cópia de a
        out += mids
        print(f'emenda {jn}: parada -{k} / -{m}, vão {gap:.1f} contra passo {med:.1f}, {len(mids)} intermediários')
        i = b; jn += 1
        continue
    out.append(files[i]); i += 1
for k, f in enumerate(out): shutil.copy(f, f'{W}/out/f_{k + 1:04d}.png')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{W}/out/f_%04d.png', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', 'film/master_smooth.mp4'], check=True)
for f in glob.glob('frames/f_*.jpg'): os.remove(f)
subprocess.run(['ffmpeg', '-v', 'error', '-i', 'film/master_smooth.mp4', '-q:v', '6', 'frames/f_%04d.jpg'], check=True)
n = len(glob.glob('frames/f_*.jpg'))
man = json.load(open('frames/manifest.json')); man['count'] = n; json.dump(man, open('frames/manifest.json', 'w'))
S2 = [small(f) for f in sorted(glob.glob(f'{W}/out/f_*.png'))]
d2 = np.array([np.abs(S2[i + 1] - S2[i]).mean() for i in range(len(S2) - 1)])
worst = sorted(((float(d2[i]) / max(float(np.median(d2[max(0, i - 10):i + 11])), 0.3), i) for i in range(len(d2))), reverse=True)[:5]
print(f'quadros {len(files)} -> {n}; piores razões passo/mediana local:', [(round(r, 1), i) for r, i in worst])
shutil.rmtree(W, ignore_errors=True)
