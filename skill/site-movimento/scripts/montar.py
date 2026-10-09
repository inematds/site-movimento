#!/usr/bin/env python3
"""Junta os clipes num filme só e extrai os quadros que o site vai rolar.

Uso: montar.py [--vertical] <pasta-do-site> <trecho> [<trecho> ...]
     trecho = clipe.mp4:primeiro:ultimo  (índices de quadro, inclusive; ultimo = -1 vai até o fim)

Do clipe 2 em diante, comece no quadro 1: o quadro 0 é o último do clipe anterior (o quadro fixado)
e repeti-lo dá uma travadinha. Use o início do primeiro trecho para cortar uma cabeça parada.

Concatena a 24 qps, grava <site>/film/master.mp4, extrai TODOS os quadros (1280 px, q5) em
<site>/frames/ (nunca pule quadros: menos quadros vira apresentação de slides), grava
frames/manifest.json {count, seam} (seam = cor da borda de baixo do último quadro, para a passagem
do filme para a seção seguinte) e mostra os piores SSIM entre quadros vizinhos do master
(valores muito baixos = corte ou tranco; rode suavizar.py para os trancos nas emendas).

--vertical: filme do celular (clipes 9:16). Grava film/master-v.mp4 (1080x1920) e os quadros em
<site>/frames-v/ (720 px de largura), ao lado do filme horizontal, sem tocar nele.
"""
import sys, os, subprocess, json, glob
VERT = '--vertical' in sys.argv
if VERT: sys.argv.remove('--vertical')
TAM, MASTER, QDIR, QLARG = (('1080:1920', 'film/master-v.mp4', 'frames-v', '720') if VERT
                            else ('1920:1080', 'film/master.mp4', 'frames', '1280'))
if len(sys.argv) < 3:
    sys.exit('uso: montar.py <pasta-do-site> c1.mp4:0:-1 c2.mp4:1:-1 ...')
site = sys.argv[1]; segs = [s if s.split(':')[0].startswith('/') else os.path.abspath(s) for s in sys.argv[2:]]
os.chdir(site)
inputs, filt = [], ''
for i, s in enumerate(segs):
    path, a, b = s.split(':'); a = int(a); b = int(b)
    inputs += ['-i', path]
    sel = f"gte(n\\,{a})" + (f"*lte(n\\,{b})" if b >= 0 else '')
    filt += f"[{i}:v]select='{sel}',setpts=N/24/TB,scale={TAM}[v{i}];"
filt += ''.join(f'[v{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=0[out]'
os.makedirs('film', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', filt, '-map', '[out]', '-r', '24', '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', MASTER], check=True)
for f in glob.glob(QDIR + '/f_*.jpg'): os.remove(f)
os.makedirs(QDIR, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-i', MASTER, '-vf', f'scale={QLARG}:-2', '-fps_mode', 'passthrough', '-q:v', '5', QDIR + '/f_%04d.jpg'], check=True)
frames = sorted(glob.glob(QDIR + '/f_*.jpg'))
last = frames[-1]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', last, '-vf', 'crop=iw:ih*0.12:0:ih*0.88,scale=1:1', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
seam = '#' + raw[:3].hex()
json.dump({'count': len(frames), 'seam': seam}, open(QDIR + '/manifest.json', 'w'))
size = sum(os.path.getsize(f) for f in frames) / 1e6
print(f'{site}: {len(frames)} quadros, {size:.1f} MB, cor da emenda {seam}')
# procura cortes no master
out = subprocess.run(['ffmpeg', '-i', MASTER, '-i', MASTER, '-lavfi', '[0]trim=start_frame=1,setpts=PTS-STARTPTS,scale=480:-1[a];[1]scale=480:-1[b];[a][b]ssim=stats_file=-', '-f', 'null', '-'], capture_output=True, text=True).stdout
v = sorted([(int(l.split('n:')[1].split()[0]), float(l.split('All:')[1].split()[0])) for l in out.splitlines() if 'All:' in l], key=lambda x: x[1])
print('piores SSIM entre quadros vizinhos:', v[:6])
