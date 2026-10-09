#!/usr/bin/env python3
"""Procura CORTES ESCONDIDOS dentro de um clipe gerado.

Uso: cortes.py <clipe.mp4> [outro.mp4 ...]

Um modelo que precisa andar demais em 5 s costuma cortar no meio do clipe e aterrissar no quadro
final: as emendas ficam perfeitas e o meio pula. Método: SSIM entre todos os pares de quadros
vizinhos (480 px de largura). Par abaixo de (mediana − 0,25) é corte.
Sai com 1 se algum arquivo tiver corte (serve de portão no pipeline).
"""
import subprocess, sys

def scan(f):
    cmd = ['ffmpeg', '-i', f, '-i', f, '-lavfi',
           '[0]trim=start_frame=1,setpts=PTS-STARTPTS,scale=480:-1[a];[1]scale=480:-1[b];[a][b]ssim=stats_file=-',
           '-f', 'null', '-']
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    v = [(int(l.split('n:')[1].split()[0]), float(l.split('All:')[1].split()[0])) for l in out.splitlines() if 'All:' in l]
    if not v:
        print(f, 'não deu para medir (não é vídeo?)'); return True
    v.sort(key=lambda x: x[1]); med = sorted(x[1] for x in v)[len(v) // 2]
    flag = [x for x in v if x[1] < med - 0.25]
    print(f, 'quadros %d, mediana %.2f, piores %s' % (len(v) + 1, med, [(n, round(s, 2)) for n, s in v[:2]]),
          ('CORTE no(s) quadro(s) %s' % [n for n, _ in flag]) if flag else 'ok')
    return bool(flag)

if len(sys.argv) < 2:
    sys.exit('uso: cortes.py <clipe.mp4> [outro.mp4 ...]')
bad = [f for f in sys.argv[1:] if scan(f)]
sys.exit(1 if bad else 0)
