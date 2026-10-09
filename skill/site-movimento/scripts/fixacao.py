#!/usr/bin/env python3
"""Mede se o motor de vídeo RESPEITA os quadros fixados: compara o 1º quadro do clipe com a imagem
de início e o último quadro com a imagem de fim.

Uso: fixacao.py <clipe.mp4> <inicio.png> [fim.png] [--min 0.90]

Métrica: SSIM por janelas 8×8 em 320×180, tons de cinza com desfoque leve. O desfoque é de
propósito: o motor redesenha ruído e textura fina (asfalto molhado, grão), e o SSIM do ffmpeg em
resolução cheia dá ~0,6 mesmo quando a imagem é a mesma. Medido no piloto (Kling v3.0):
mesmo quadro ≥ 0,98; imagens diferentes do mesmo filme ~0,15–0,4.
Leitura: ≥ 0,90 = fixa (serve para encadear). Sai com 1 se algum lado ficar abaixo de --min.
"""
import argparse, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('clipe'); ap.add_argument('inicio'); ap.add_argument('fim', nargs='?')
ap.add_argument('--min', type=float, default=0.90)
a = ap.parse_args()


def cinza(p):
    im = Image.open(p).convert('L').resize((320, 180), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
    return np.asarray(im, dtype=float)


def ssim(x, y, j=8):
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    h, w = (x.shape[0] // j) * j, (x.shape[1] // j) * j
    bx = x[:h, :w].reshape(h // j, j, w // j, j).swapaxes(1, 2).reshape(-1, j * j)
    by = y[:h, :w].reshape(h // j, j, w // j, j).swapaxes(1, 2).reshape(-1, j * j)
    mx, my = bx.mean(1), by.mean(1)
    vx, vy = bx.var(1), by.var(1)
    cov = ((bx - mx[:, None]) * (by - my[:, None])).mean(1)
    return float(np.mean(((2 * mx * my + C1) * (2 * cov + C2)) / ((mx ** 2 + my ** 2 + C1) * (vx + vy + C2))))


def quadro(fim):
    out = os.path.join(tempfile.mkdtemp(), 'q.png')
    pre = ['-sseof', '-0.1'] if fim else []
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *pre, '-i', a.clipe, '-frames:v', '1', '-update', '1', out], check=True)
    return out


ok = True
s0 = ssim(cinza(a.inicio), cinza(quadro(False)))
print(f'início  {s0:.3f}')
ok &= s0 >= a.min
if a.fim:
    s1 = ssim(cinza(a.fim), cinza(quadro(True)))
    print(f'fim     {s1:.3f}')
    ok &= s1 >= a.min
print('FIXA' if ok else 'NÃO FIXA')
sys.exit(0 if ok else 1)
