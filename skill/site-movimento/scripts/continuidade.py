#!/usr/bin/env python3
"""Portão de continuidade: prova que o filme é UM movimento de câmera, não uma sequência de cenas.

Uso: continuidade.py <pasta-de-quadros> [passo=4]
     (quadros f_*.jpg gerados por montar.py)

Por que não basta conferir as emendas: com o encadeamento, cada clipe começa no último quadro do
anterior, então as emendas casam por construção. O que escapa é o MEIO de cada clipe, onde o
modelo pode cortar ou congelar.

Por que não basta um limite fixo de SSIM: um travelling rápido e liso muda quase tudo e marca
~0,5; um corte entre dois quadros parecidos marca alto. O que separa corte de movimento é o
FORMATO LOCAL da curva:
  - movimento liso → cada par parecido com os vizinhos, por mais baixo que seja;
  - corte          → queda brusca bem abaixo da mediana LOCAL;
  - congelamento   → ~1,0: a câmera parou, zona morta na rolagem.

PASSA: nenhum par abaixo de 45% da mediana local e no máximo 2 pares congelados.
"""
import glob, sys
import numpy as np
from PIL import Image


def cinza(p):
    return np.asarray(Image.open(p).convert('L').resize((320, 180)), dtype=float)


def ssim(x, y, j=8):
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    h, w = (x.shape[0] // j) * j, (x.shape[1] // j) * j
    bx = x[:h, :w].reshape(h // j, j, w // j, j).swapaxes(1, 2).reshape(-1, j * j)
    by = y[:h, :w].reshape(h // j, j, w // j, j).swapaxes(1, 2).reshape(-1, j * j)
    mx, my, vx, vy = bx.mean(1), by.mean(1), bx.var(1), by.var(1)
    cov = ((bx - mx[:, None]) * (by - my[:, None])).mean(1)
    return float(np.mean(((2 * mx * my + C1) * (2 * cov + C2)) / ((mx ** 2 + my ** 2 + C1) * (vx + vy + C2))))


if len(sys.argv) < 2:
    sys.exit('uso: continuidade.py <pasta-de-quadros> [passo]')
pasta = sys.argv[1]; passo = int(sys.argv[2]) if len(sys.argv) > 2 else 4
quadros = sorted(glob.glob(f'{pasta}/f_*.jpg'))[::passo]
if len(quadros) < 4:
    sys.exit(f'FALHA: só {len(quadros)} quadros em {pasta} — um portão que passa sem medir é pior que nenhum')
notas, nomes = [], []
ant = cinza(quadros[0])
for q in quadros[1:]:
    atual = cinza(q)
    notas.append(ssim(ant, atual)); nomes.append(q.rsplit('/', 1)[-1])
    ant = atual

cortes, congelados = [], []
for i, s in enumerate(notas):
    viz = notas[max(0, i - 3):i + 4]
    local = float(np.median(viz))
    if s < 0.45 * local:
        cortes.append(f'{nomes[i]}  {s:.3f} contra local {local:.3f}')
    if s > 0.995:
        congelados.append(f'{nomes[i]}  {s:.3f}')

print(f'continuidade — {pasta}: {len(quadros)} quadros (a cada {passo}), mediana {np.median(notas):.3f}')
for c in cortes[:6]:
    print('  corte:', c)
for c in congelados[:6]:
    print('  congelado:', c)
falha = bool(cortes) or len(congelados) > 2
if falha:
    print('REPROVADO. Não construa em cima disto: aproxime os keyframes (passo menor), mantenha o mesmo eixo de câmera e refaça o clipe.')
    sys.exit(1)
print('PASSA — um movimento só')
