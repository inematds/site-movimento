#!/usr/bin/env python3
"""Copia a home do eventos.inema.pro (repo inemaeventos, só leitura) para o piloto e reescreve os
caminhos: assets locais viram relativos (o piloto vive em /site-movimento/piloto/eventos/ no Pages);
links para outras páginas do eventos viram absolutos para o site no ar."""
import os, re, shutil

ORIG = os.path.expanduser('~/projetos/inemaeventos')
DEST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
html = open(os.path.join(ORIG, 'index.html'), encoding='utf-8').read()

assets = sorted(set(re.findall(r'(?:src|href)="/([^"]+\.(?:css|js|png|jpg|webp|svg))"', html)))
for a in assets:
    os.makedirs(os.path.dirname(os.path.join(DEST, a)) or DEST, exist_ok=True)
    shutil.copy2(os.path.join(ORIG, a), os.path.join(DEST, a))


# O landing.js busca as notícias por caminho absoluto: copia o JSON e torna o caminho relativo.
shutil.copy2(os.path.join(ORIG, 'shared', 'news.json'), os.path.join(DEST, 'shared', 'news.json'))
js = os.path.join(DEST, 'shared', 'landing.js')
conteudo = open(js, encoding='utf-8').read()   # ler ANTES de abrir para escrita (abrir com 'w' trunca)
open(js, 'w', encoding='utf-8').write(conteudo.replace("fetch('/shared/news.json')", "fetch('shared/news.json')"))


def troca(m):
    attr, caminho = m.group(1), m.group(2)
    if caminho in assets:
        return f'{attr}="{caminho}"'
    return f'{attr}="https://eventos.inema.pro/{caminho}"'


html = re.sub(r'(src|href)="/([^"]*)"', troca, html)
# Regra de texto do piloto: sem travessão no que se lê. Só no texto entre tags do <body>
# (atributos e o <head> ficam como estão). O site no ar não muda.
ini = html.index('<body')
corpo = re.sub(r'>([^<]*)<', lambda m: '>' + m.group(1).replace(' — ', ': ').replace(' – ', ': ') + '<', html[ini:])
html = html[:ini] + corpo
html = html.replace('<link href="https://eventos.inema.pro/" rel="canonical"/>', '<meta name="robots" content="noindex"/>')
open(os.path.join(DEST, 'index.html'), 'w', encoding='utf-8').write(html)
print(f'{len(assets)} arquivos copiados; index.html reescrito em {DEST}')
