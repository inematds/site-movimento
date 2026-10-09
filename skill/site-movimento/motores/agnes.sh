#!/usr/bin/env bash
# Motor AGNES — agnes-video-v2.0 no modo "keyframes" (interpola entre início e fim).
# Precisa de AGNES_API_KEY no ambiente (ou num .env apontado por AGNES_ENV_FILE).
#
# Particularidades medidas em uso real:
#   - prompts em INGLÊS (português dispara o filtro de conteúdo com 400 sem motivo);
#   - ~1/3 de respostas 503 transitórias: o polling insiste;
#   - limite de ~1 vídeo por minuto: espaçar os clipes;
#   - num_frames precisa ser 8n+1 (81 = ~3,4 s a 24 qps); teto por altura: 720p 481, 1080p 241, 480p 961;
#   - a consulta do job é em <base>/agnesapi?video_id= (SEM o /v1 do POST); o id vem em video_id, task_id ou id;
#   - imagens vão como data URI base64 em JPEG (não precisa URL pública; PNG estourou 120 s no envio);
#   - envio com 300 s de espera; tempo esgotado NÃO é repetido (o job pode ter nascido e seria pago 2x).
# Exige quadro de fim: sem ele o modo keyframes não existe (use outro motor para "só início").
set -euo pipefail
source "$(dirname "$0")/_comum.sh"
contrato_args "$@"
INI=$1; FIM=$2; PROMPT=$3; SEG=$4; OUT=$5
[ "$FIM" != "-" ] || { echo "agnes: modo keyframes exige imagem de fim" >&2; exit 2; }
FPS=${AGNES_FPS:-24}; W=${AGNES_LARGURA:-1280}; H=${AGNES_ALTURA:-720}
BASE=${AGNES_API_BASE:-https://apihub.agnes-ai.com}; API=$BASE/v1
QUADROS=$(python3 -c "import sys;s=float(sys.argv[1]);n=round((s*$FPS-1)/8);t=241 if $H>1000 else (481 if $H>500 else 961);print(min(t,max(17,8*n+1)))" "$SEG")

if [ "${DRY_RUN:-0}" = 1 ]; then
  echo "POST $API/videos model=agnes-video-v2.0 mode=keyframes num_frames=$QUADROS fps=$FPS ${W}x${H} inicio=$INI fim=$FIM"
  exit 0
fi
KEY=$(chave AGNES_API_KEY "${AGNES_ENV_FILE:-}")
[ -n "$KEY" ] || { echo "agnes: AGNES_API_KEY não definida" >&2; exit 2; }
mkdir -p "$(dirname "$OUT")"

MOTOR_CHAVE="$KEY" python3 - "$BASE" "$PROMPT" "$QUADROS" "$FPS" "$W" "$H" "$INI" "$FIM" "$OUT" <<'PY'
import base64, json, sys, time, urllib.error, urllib.request
import os
key = os.environ['MOTOR_CHAVE']  # pelo ambiente: em argv a chave aparece no ps
base, prompt, quadros, fps, w, h, ini, fim, out = sys.argv[1:]
api = base + '/v1'
def uri(p):  # JPEG q92: o PNG em base64 deixava o envio lento a ponto de estourar o tempo
    import io
    from PIL import Image
    b = io.BytesIO(); Image.open(p).convert('RGB').save(b, 'JPEG', quality=92)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
H = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}
corpo = {'model': 'agnes-video-v2.0', 'prompt': prompt, 'num_frames': int(quadros), 'frame_rate': int(fps),
         'width': int(w), 'height': int(h), 'extra_body': {'image': [uri(ini), uri(fim)], 'mode': 'keyframes'}}
r = None
for t in range(1, 5):  # 503 transitório e 429 (≈6/min) são comuns no envio
    try:
        r = json.load(urllib.request.urlopen(urllib.request.Request(api + '/videos', json.dumps(corpo).encode(), H), timeout=300))
        break
    except urllib.error.HTTPError as e:
        print(f'agnes: envio HTTP {e.code}: {e.read()[:160].decode(errors="ignore")}', file=sys.stderr)
        if e.code not in (429, 500, 502, 503, 504): sys.exit(1)
        time.sleep(70 if e.code == 429 else 8 * t)
if r is None:
    sys.exit('agnes: a API não aceitou o job após 4 tentativas')
open(out + '.json', 'w').write(json.dumps(r))  # id do job gravado antes de esperar
vid = r.get('video_id') or r.get('task_id') or r.get('id')
if not vid:
    sys.exit('agnes: resposta sem id: ' + json.dumps(r)[:300])
for _ in range(120):
    time.sleep(10)
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(f'{base}/agnesapi?video_id={vid}', headers=H), timeout=60))
    except Exception:
        continue  # 503 transitório
    st = d.get('status', '')
    if st == 'completed':
        url = d.get('video_url') or d.get('url') or (d.get('data') or [{}])[0].get('url')
        open(out + '.json', 'w').write(json.dumps(d))
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        open(out, 'wb').write(urllib.request.urlopen(req, timeout=600).read())
        sys.exit(0)
    if st == 'failed':
        sys.exit('agnes: job falhou: ' + json.dumps(d)[:300])
sys.exit('agnes: tempo esgotado esperando o job ' + vid)
PY
ultimo_quadro "$OUT"
anotar agnes "agnes-video-v2.0/${QUADROS}q" 0 "$OUT" "$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('video_id') or d.get('task_id') or d.get('id') or '')" "$OUT.json")"
echo "OK $OUT"
