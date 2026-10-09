#!/usr/bin/env python3
"""Revisa a cadeia de keyframes antes de gastar qualquer crédito de vídeo.

Uso: folha_kf.py <pasta-kf> [limite=0.30]
  - grava <pasta-kf>/folha.jpg: todos os keyframes em ordem, numerados, < 100 KB (para o modelo olhar);
  - mostra a semelhança estrutural de cada par vizinho (cinza 256×144, nota tipo SSIM);
  - marca pares que mudaram demais: é ali que um clipe de 5 s vai cortar.

Nota baixa quer dizer OLHE, não REPROVA. O defeito real é virar o eixo da câmera (vista lateral vira
vista de cima, horizonte inclina), trocar de lugar ou de luz. Refaça o keyframe marcado com um passo
menor, ou ponha um keyframe entre os dois.
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageDraw

d = sys.argv[1] if len(sys.argv) > 1 else '.'
thr = float(sys.argv[2]) if len(sys.argv) > 2 else 0.30
files = [f for f in sorted(glob.glob(os.path.join(d, '*.png'))) if not f.endswith('.ref.png')]
if len(files) < 2:
    sys.exit('preciso de pelo menos 2 keyframes (*.png) em ' + d)

def abrir(p):
    return Image.open(p).convert('L')

def cinza(im):
    return np.asarray(im.resize((256, 144), Image.LANCZOS), dtype=np.float64)

def ssim(a, b):
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    ma, mb = a.mean(), b.mean(); va, vb = a.var(), b.var(); cov = ((a - ma) * (b - mb)).mean()
    glob_s = ((2 * ma * mb + c1) * (2 * cov + c2)) / ((ma ** 2 + mb ** 2 + c1) * (va + vb + c2))
    # média por blocos, para a estrutura local
    s = []
    for y in range(0, 144, 16):
        for x in range(0, 256, 16):
            A, B = a[y:y + 16, x:x + 16], b[y:y + 16, x:x + 16]
            mA, mB = A.mean(), B.mean(); vA, vB = A.var(), B.var(); cv = ((A - mA) * (B - mB)).mean()
            s.append(((2 * mA * mB + c1) * (2 * cv + c2)) / ((mA ** 2 + mB ** 2 + c1) * (vA + vB + c2)))
    return 0.5 * glob_s + 0.5 * float(np.mean(s))

def recorte(im, z, cx, cy):
    W, H = im.size; w, h = W / z, H / z
    x0 = min(max(cx * W - w / 2, 0), W - w); y0 = min(max(cy * H - h / 2, 0), H - h)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))

def passo(a, b):
    """Melhor nota entre A e B procurando a ESCALA e o centro: um passo de aproximação (ou recuo)
    muda o quadro inteiro de lugar, mas o centro de A ampliado tem que parecer com B."""
    melhor, onde = -1.0, (1.0, 0.5, 0.5, 'igual')
    gb, ga = cinza(b), cinza(a)
    for z in (1.0, 1.25, 1.5, 1.8, 2.0, 2.3):
        for cx in (0.4, 0.5, 0.6):
            for cy in (0.4, 0.5, 0.6):
                if z == 1.0 and (cx, cy) != (0.5, 0.5):
                    continue
                s1 = ssim(cinza(recorte(a, z, cx, cy)), gb)        # B é A mais perto
                s2 = ssim(ga, cinza(recorte(b, z, cx, cy)))        # B é A mais longe
                for s_, sent in ((s1, 'aproxima'), (s2, 'recua')):
                    if s_ > melhor:
                        melhor, onde = s_, (z, cx, cy, sent if z > 1 else 'igual')
    return melhor, onde

IMS = [abrir(f) for f in files]
flags = []
print(f'{len(files)} keyframes em {d}')
for i in range(len(files) - 1):
    s, (z, cx, cy, sent) = passo(IMS[i], IMS[i + 1])
    mark = 'QUEBRA? eixo, lugar ou luz provavelmente mudou: refaça ou ponha um keyframe no meio' if s < 0.12 else ('OLHE' if s < thr else 'ok')
    if sent == 'igual' and s > 0.95:
        mark = 'PARADO: o keyframe não andou (o modelo devolveu a referência): use kf_aproxima.py'
    if s < thr or mark.startswith('PARADO'): flags.append(i)
    print(f'  {os.path.basename(files[i]):<14} -> {os.path.basename(files[i + 1]):<14} {s:.2f}  {sent} {z}x  {mark}')

tw, th, cols = 384, 216, 4
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (24, 24, 24))
dr = ImageDraw.Draw(sheet)
for k, f in enumerate(files):
    im = Image.open(f).convert('RGB'); im.thumbnail((tw - 6, th - 6))
    x, y = (k % cols) * tw + 3, (k // cols) * th + 3
    sheet.paste(im, (x, y))
    dr.rectangle([x, y, x + 34, y + 20], fill=(0, 0, 0)); dr.text((x + 6, y + 4), str(k + 1), fill=(255, 255, 255))
    if k - 1 in flags: dr.rectangle([x, y, x + im.width - 1, y + im.height - 1], outline=(217, 119, 87), width=4)
out = os.path.join(d, 'folha.jpg'); q = 80
sheet.save(out, quality=q)
while os.path.getsize(out) > 98000 and q > 35:
    q -= 8; sheet.save(out, quality=q)
if os.path.getsize(out) > 98000:
    sheet.thumbnail((int(sheet.width * .7), int(sheet.height * .7))); sheet.save(out, quality=q)
print(f'folha: {out} ({os.path.getsize(out) // 1024} KB)  borda laranja = mudança grande em relação ao anterior')
print('Olhe a folha. Refaça todo keyframe que vire o eixo da câmera, troque de lugar ou de luz.')
