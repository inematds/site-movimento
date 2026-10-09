#!/usr/bin/env bash
# Motor AGNES — agnes-video-v2.0 no modo "keyframes" (interpola entre início e fim).
# Precisa de AGNES_API_KEY no ambiente (ou num .env apontado por AGNES_ENV_FILE).
#
# Particularidades medidas em uso real:
#   - prompts em INGLÊS (português dispara o filtro de conteúdo com 400 sem motivo);
#   - ~1/3 de respostas 503 transitórias: o polling insiste;
#   - limite de ~1 vídeo por minuto: espaçar os clipes;
#   - num_frames precisa ser 8n+1 (81 = ~3,4 s a 24 qps) e ≤ 441;
#   - imagens vão como data URI base64 (não precisa URL pública).
# Exige quadro de fim: sem ele o modo keyframes não existe (use outro motor para "só início").
set -euo pipefail
source "$(dirname "$0")/_comum.sh"
contrato_args "$@"
INI=$1; FIM=$2; PROMPT=$3; SEG=$4; OUT=$5
[ "$FIM" != "-" ] || { echo "agnes: modo keyframes exige imagem de fim" >&2; exit 2; }
FPS=${AGNES_FPS:-24}; W=${AGNES_LARGURA:-1280}; H=${AGNES_ALTURA:-720}
API=${AGNES_API_BASE:-https://apihub.agnes-ai.com/v1}
QUADROS=$(python3 -c "import sys;s=float(sys.argv[1]);n=round((s*$FPS-1)/8);print(min(441,max(17,8*n+1)))" "$SEG")

if [ "${DRY_RUN:-0}" = 1 ]; then
  echo "POST $API/videos model=agnes-video-v2.0 mode=keyframes num_frames=$QUADROS fps=$FPS ${W}x${H} inicio=$INI fim=$FIM"
  exit 0
fi
KEY=$(chave AGNES_API_KEY "${AGNES_ENV_FILE:-}")
[ -n "$KEY" ] || { echo "agnes: AGNES_API_KEY não definida" >&2; exit 2; }
mkdir -p "$(dirname "$OUT")"

python3 - "$API" "$KEY" "$PROMPT" "$QUADROS" "$FPS" "$W" "$H" "$INI" "$FIM" "$OUT" <<'PY'
import base64, json, sys, time, urllib.request
api, key, prompt, quadros, fps, w, h, ini, fim, out = sys.argv[1:]
def uri(p):
    tipo = 'image/png' if p.lower().endswith('.png') else 'image/jpeg'
    return f'data:{tipo};base64,' + base64.b64encode(open(p, 'rb').read()).decode()
H = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}
corpo = {'model': 'agnes-video-v2.0', 'prompt': prompt, 'num_frames': int(quadros), 'frame_rate': int(fps),
         'width': int(w), 'height': int(h), 'extra_body': {'image': [uri(ini), uri(fim)], 'mode': 'keyframes'}}
r = json.load(urllib.request.urlopen(urllib.request.Request(api + '/videos', json.dumps(corpo).encode(), H), timeout=120))
open(out + '.json', 'w').write(json.dumps(r))  # id do job gravado antes de esperar
vid = r.get('id') or r.get('video_id')
if not vid:
    sys.exit('agnes: resposta sem id: ' + json.dumps(r)[:300])
for _ in range(120):
    time.sleep(10)
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(f'{api}/agnesapi?video_id={vid}', headers=H), timeout=60))
    except Exception:
        continue  # 503 transitório
    st = d.get('status', '')
    if st == 'completed':
        url = d.get('video_url') or d.get('url')
        open(out + '.json', 'w').write(json.dumps(d))
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        open(out, 'wb').write(urllib.request.urlopen(req, timeout=600).read())
        sys.exit(0)
    if st == 'failed':
        sys.exit('agnes: job falhou: ' + json.dumps(d)[:300])
sys.exit('agnes: tempo esgotado esperando o job ' + vid)
PY
ultimo_quadro "$OUT"
anotar agnes "agnes-video-v2.0/${QUADROS}q" 0 "$OUT" "$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('id') or d.get('video_id') or '')" "$OUT.json")"
echo "OK $OUT"
