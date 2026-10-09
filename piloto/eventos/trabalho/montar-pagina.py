#!/usr/bin/env python3
"""Encaixa o filme de abertura e a camada de movimento na cópia da home do eventos.
Idempotente: roda copiar-base.py antes (base limpa) e depois este."""
import os, shutil

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(os.path.join(AQUI, '..'))
RAIZ = os.path.abspath(os.path.join(SITE, '..', '..'))
p = os.path.join(SITE, 'index.html')
h = open(p, encoding='utf-8').read()
assert 'id="filme"' not in h, 'rode copiar-base.py antes (base já tem o filme)'

os.makedirs(os.path.join(SITE, 'vendor'), exist_ok=True)
for f in ('motor-rolagem.js', 'chave-movimento.js'):
    shutil.copy2(os.path.join(RAIZ, 'skill', 'site-movimento', 'runtime', f), os.path.join(SITE, 'vendor', f))
os.makedirs(os.path.join(SITE, 'assets'), exist_ok=True)
shutil.copy2(os.path.join(AQUI, 'loops', 'painel.mp4'), os.path.join(SITE, 'assets', 'painel.mp4'))
# WebM (VP9) como primeira fonte: toca em qualquer navegador, inclusive Chromium sem H.264.
webm = os.path.join(SITE, 'assets', 'painel.webm')
if not os.path.exists(webm):
    import subprocess
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(AQUI, 'loops', 'painel.mp4'), '-an', '-c:v', 'libvpx-vp9',
                    '-b:v', '0', '-crf', '36', '-row-mt', '1', webm], check=True)

PROMPT_FILME = ('Slow steady dolly forward across the wet apron toward the glowing terminal, through the glass doors, '
                'until the departures board fills the frame. Camera at eye level, centered, one continuous move.')

cabeca = ('<link href="movimento/movimento.css" rel="stylesheet"/>'
          '<script defer src="vendor/chave-movimento.js"></script>'
          '<script defer src="vendor/motor-rolagem.js"></script>'
          '<script defer src="movimento/movimento.js"></script></head>')
h = h.replace('</head>', cabeca, 1)

filme = f'''<main>
<section aria-label="Abertura" class="filme" id="filme">
<div class="palco">
<canvas aria-hidden="true" data-xray="filme de abertura · 3 clipes encadeados de 5 s, anda com a rolagem" data-xray-cost="90" data-xray-prompt="{PROMPT_FILME}" data-xray-tool="kling" id="tela"></canvas>
<div class="veu"></div>
<div class="fim"></div>
<div class="batida alto" data-in="-0.1" data-out="0.24" data-peak="0"><p class="selo">INEMA eventos</p><h2>Toda turma começa com uma partida.</h2></div>
<div class="batida baixo" data-in="0.3" data-out="0.62" data-peak="0.44"><h2>Áreas, imersões e projetos.</h2><p>IA na prática, com turma marcada ou no seu ritmo.</p></div>
<div class="batida alto" data-in="0.6" data-out="0.86" data-peak="0.72"><h2>Tudo o que está aberto, num painel.</h2></div>
<div aria-hidden="true" class="capitulo"><span class="rotulo" data-capitulos="Pista|Terminal|Painel">Pista</span><span class="trilho"><i></i></span></div>
<div aria-hidden="true" class="carregando"></div>
</div>
</section>'''
h = h.replace('<main>', filme, 1)

video = ('<figure class="news-painel"><video aria-hidden="true" autoplay data-xray="painel que atualiza · loop de 5 s, começa e termina no mesmo quadro" '
         'data-xray-cost="30" data-xray-tool="kling" loop muted playsinline poster="frames/f_0361.jpg" preload="metadata">'
         '<source src="assets/painel.webm" type="video/webm"/><source src="assets/painel.mp4" type="video/mp4"/></video></figure>')
marca = '<a class="botao-news" href="https://news.inema.pro/">Ler o INEMA News</a>'
assert marca in h
h = h.replace(marca, marca + video, 1)

# o painel split-flap original também é movimento em código: entra no Raio-X
h = h.replace('<div class="painel">', '<div class="painel" data-xray="painel de partidas · as letras viram plaqueta por plaqueta" data-xray-tool="code">', 1)
open(p, 'w', encoding='utf-8').write(h)
print('página montada:', p)
