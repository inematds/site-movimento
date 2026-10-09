#!/usr/bin/env python3
"""Confere a DIREÇÃO do filme antes de gastar qualquer crédito (grátis e instantâneo).

Uso: vetor.py <roteiro.json>

Pega o defeito que nenhum portão depois pega: emendas perfeitas, cada clipe contínuo, e mesmo assim
a câmera vai e volta. Quem visita rola num sentido só; a câmera tem que concordar.

roteiro.json precisa de:
  "vetor": uma frase com o sentido único do filme ("a câmera só avança para dentro")
  opcional "direcao": "dentro" | "fora"   (quando a frase não deixa claro)
  opcional "inversao_em": "<id do clipe>" (UMA virada declarada; a partir dela o sentido inverte)
  "clipes": [{"id": "c1", "prompt": "..."}]

Cada prompt precisa dizer o sentido do movimento. Clipe com as duas direções = volta no meio.
Clipe sem nenhuma = o modelo inventa uma. Palavras em inglês e português valem.
"""
import json, re, sys

DENTRO = (r"\b(into|inward|deeper|closer|toward|towards|push(?:ing|es)?\s+in|forward|advanc\w+|approach\w+|"
          r"descend\w*|descent|down\s+into|enter\w*|through|falls?|falling|sink\w+|plunge\w*|downward|"
          r"dolly\s+(?:in|forward)|zoom\w*\s+in|"
          r"avanç\w+|aproxim\w+|entra\w*|para\s+dentro|adentr\w+|mergulh\w+|desc[ei]\w+|atravess\w+|em\s+direção)\b")
FORA = (r"\b(outward|away|backward|retreat\w*|withdraw\w*|pull(?:ing|s)?\s+back|recede\w*|exit(?:s|ing)?|"
        r"rises?|rising|ascend\w*|climb\w+|upward|dolly\s+out|zoom\w*\s+out|"
        r"recu\w+|afast\w+|sai\w*\s+de|para\s+fora|sobe|subindo|sub[ei]\w+)\b")
# Frases com palavra de direção que não descrevem movimento de câmera.
RUIDO = re.compile(r"out\s+of\s+(frame|focus|the\s+dark\w*|view|nowhere)|no\s+(edits?|cuts?|scene\s+changes?)"
                   r"|without\s+\w+|sem\s+cortes?|fora\s+de\s+foco", re.I)


def sentido(texto):
    t = RUIDO.sub(' ', texto.lower())
    return (sorted({m.group(0) for m in re.finditer(DENTRO, t)}), sorted({m.group(0) for m in re.finditer(FORA, t)}))


def main():
    if len(sys.argv) < 2:
        sys.exit('uso: vetor.py <roteiro.json>')
    r = json.load(open(sys.argv[1]))
    clipes = r.get('clipes', [])
    if not clipes:
        sys.exit('roteiro sem clipes')
    vetor, direcao, virada = r.get('vetor'), r.get('direcao'), r.get('inversao_em')
    if direcao not in (None, 'dentro', 'fora'):
        sys.exit('"direcao" precisa ser "dentro" ou "fora"')
    if direcao is None and vetor:
        d, f = sentido(vetor)
        direcao = None if bool(d) == bool(f) else ('dentro' if d else 'fora')

    print(f'vetor — {len(clipes)} clipes')
    print(f'  vetor declarado: {vetor or "(NENHUM — declare um)"}')
    print(f'  sentido base: {direcao or "(AMBÍGUO — defina \"direcao\")"}')
    ids = [c.get('id', '?') for c in clipes]
    vira = ids.index(virada) if virada in ids else None
    if virada and vira is None:
        print(f'  ! inversao_em "{virada}" não bate com nenhum id')

    errados, mudos = [], []
    for i, c in enumerate(clipes):
        cid = c.get('id', '?')
        d, f = sentido(c.get('prompt') or '')
        esperado_fora = (direcao == 'fora') if vira is None or i < vira else (direcao != 'fora')
        if d and f:
            errados.append(cid); print(f'  ✗ {cid:<12} VOLTA no meio: dentro={d} fora={f}')
        elif not d and not f:
            mudos.append(cid); print(f'  ✗ {cid:<12} não diz o sentido — o modelo vai inventar')
        else:
            s = 'fora' if f else 'dentro'
            errado = direcao is not None and ((s == 'fora') != esperado_fora)
            if errado:
                errados.append(cid)
            print(f'  {"✗" if errado else "✓"} {cid:<12} {s}' + (f'  <- esperado {"fora" if esperado_fora else "dentro"}' if errado else ''))

    falha = False
    if not vetor:
        print('REPROVA: falta "vetor" — escreva numa frase o sentido único do filme antes dos clipes.'); falha = True
    elif direcao is None:
        print('REPROVA: o vetor é ambíguo — use uma palavra de direção ou defina "direcao".'); falha = True
    if errados:
        print(f'REPROVA: {len(errados)} clipe(s) brigam com o vetor: {", ".join(errados)} — divida o clipe ou escolha um sentido.'); falha = True
    if mudos:
        print(f'REPROVA: {len(mudos)} clipe(s) sem sentido: {", ".join(mudos)} — diga como o clipe CONTINUA o anterior.'); falha = True
    if falha:
        print('Arrume o roteiro antes de gerar. Este é o único portão de graça.'); sys.exit(1)
    print('PASSA — todos os clipes seguem o vetor')


if __name__ == '__main__':
    main()
