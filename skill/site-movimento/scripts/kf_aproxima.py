#!/usr/bin/env python3
"""Keyframe seguinte por APROXIMAÇÃO: recorta o centro do keyframe anterior, amplia e pede ao
modelo de imagem só para redesenhar os detalhes naquela distância.

Por que: modelos de edição tendem a devolver a referência quase igual quando o prompt diz
"a câmera andou para frente". Recortar primeiro garante o mesmo eixo de câmera e um passo
pequeno (a regra que impede o filme de pular); o modelo só acrescenta nitidez e o que aparece
mais perto.

Uso: kf_aproxima.py <anterior.png> <saida.png> "<prompt da cena nessa distância>"
       [--fator 1.8] [--centro 0.5,0.48] [--largura 720 --altura 1280]

--largura/--altura mudam a proporção da saída: o recorte já sai nessa proporção (o maior que cabe,
dividido pelo fator). Com --fator 1 e 720x1280 a partir de um keyframe 16:9, nasce a versão vertical
(celular) do MESMO quadro, no mesmo eixo de câmera; dali a cadeia segue normal na vertical.
"""
import argparse, os, subprocess, sys, tempfile
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('anterior'); ap.add_argument('saida'); ap.add_argument('prompt')
ap.add_argument('--fator', type=float, default=1.8, help='quanto aproxima (1.5 a 2.0 = passo seguro)')
ap.add_argument('--centro', default='0.5,0.5', help='ponto de mira, fração x,y da imagem')
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--largura', type=int); ap.add_argument('--altura', type=int)
a = ap.parse_args()

im = Image.open(a.anterior).convert('RGB')
W, H = im.size
OW, OH = (a.largura or W), (a.altura or H)
cx, cy = (float(v) for v in a.centro.split(','))
esc = min(W / OW, H / OH)  # maior recorte com a proporção da saída que cabe no anterior
w, h = OW * esc / a.fator, OH * esc / a.fator
x0 = min(max(cx * W - w / 2, 0), W - w)
y0 = min(max(cy * H - h / 2, 0), H - h)
recorte = im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h))).resize((OW, OH), Image.LANCZOS)

tmp = os.path.join(tempfile.mkdtemp(), 'recorte.png')
recorte.save(tmp)
aqui = os.path.dirname(os.path.abspath(__file__))
motor = os.path.join(aqui, '..', 'motores', 'imagem_local.py')
r = subprocess.run([sys.executable, motor, a.saida, a.prompt, '--ref', tmp,
                    '--largura', str(OW), '--altura', str(OH), '--seed', str(a.seed)])
sys.exit(r.returncode)
