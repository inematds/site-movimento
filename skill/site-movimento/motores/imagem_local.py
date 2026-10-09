#!/usr/bin/env python3
"""Keyframe por imagem local (inemaimg / flux2-klein), sem custo.

Uso: imagem_local.py <saida.png> "<prompt>" [--ref a.png ...] [--largura 1344] [--altura 768] [--seed N]

Com --ref, o modelo recebe as imagens como referência (edição): é assim que o keyframe N+1
nasce do N e o filme fica no mesmo lugar. Servidor: $IMG_API (padrão http://localhost:8000).
"""
import argparse, base64, json, os, sys, time, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('saida'); ap.add_argument('prompt')
ap.add_argument('--ref', action='append', default=[])
ap.add_argument('--largura', type=int, default=1344)
ap.add_argument('--altura', type=int, default=768)
ap.add_argument('--seed', type=int)
ap.add_argument('--modelo', default=os.environ.get('IMG_MODELO', 'flux2-klein'))
a = ap.parse_args()

api = os.environ.get('IMG_API', 'http://localhost:8000')
corpo = {'model': a.modelo, 'prompt': a.prompt, 'width': a.largura, 'height': a.altura}
if a.seed is not None:
    corpo['seed'] = a.seed
if a.ref:
    corpo['images'] = [base64.b64encode(open(r, 'rb').read()).decode() for r in a.ref]

t0 = time.time()
req = urllib.request.Request(f'{api}/generate', data=json.dumps(corpo).encode(),
                             headers={'Content-Type': 'application/json'})
resp = json.load(urllib.request.urlopen(req, timeout=900))


def achar_b64(o):
    """A resposta varia por versão do servidor: procura a primeira string base64 de imagem."""
    if isinstance(o, str) and len(o) > 1000:
        return o.split(',', 1)[-1]
    if isinstance(o, dict):
        for k in ('image', 'images', 'b64', 'data', 'result'):
            if k in o:
                r = achar_b64(o[k])
                if r:
                    return r
        for v in o.values():
            r = achar_b64(v)
            if r:
                return r
    if isinstance(o, list):
        for v in o:
            r = achar_b64(v)
            if r:
                return r
    return None


b64 = achar_b64(resp)
if not b64:
    sys.exit(f'resposta sem imagem: {json.dumps(resp)[:300]}')
os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
open(a.saida, 'wb').write(base64.b64decode(b64))
print(f'{a.saida} ({time.time() - t0:.0f}s, refs={len(a.ref)})')
