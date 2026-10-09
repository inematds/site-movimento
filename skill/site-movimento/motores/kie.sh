#!/usr/bin/env bash
# Motor KIE — hub de modelos de vídeo por uma chave só (vários modelos de vídeo).
# Precisa de KIE_API_KEY no ambiente (ou num .env apontado por KIE_ENV_FILE).
#
# O Kie pede as imagens como URL pública. Duas formas:
#   1) KIE_SUBIR="<comando>" — um comando seu que recebe um caminho local e imprime a URL pública
#      (ex.: um script que sobe para o seu bucket ou CDN);
#   2) sem KIE_SUBIR, o motor usa o upload base64 do próprio Kie (KIE_UPLOAD_URL).
#
# Cada modelo do Kie tem nomes de campo próprios. O padrão abaixo é para modelos com início e fim
# (image_url + tail_image_url). Para outro modelo, troque KIE_MODELO e, se preciso, KIE_CAMPOS
# (JSON com os nomes: {"inicio":"...","fim":"...","prompt":"...","duracao":"..."}).
# Confira na documentação do modelo escolhido se ele RESPEITA o quadro de início (rode
# scripts/fixacao.py no primeiro clipe antes de encadear o filme inteiro).
set -euo pipefail
source "$(dirname "$0")/_comum.sh"
contrato_args "$@"
INI=$1; FIM=$2; PROMPT=$3; SEG=$4; OUT=$5
API=${KIE_API_BASE:-https://api.kie.ai/api/v1}
MODELO=${KIE_MODELO:-kling/v2-1-pro}
CAMPOS=${KIE_CAMPOS:-'{"inicio":"image_url","fim":"tail_image_url","prompt":"prompt","duracao":"duration"}'}
UPLOAD=${KIE_UPLOAD_URL:-https://kieai.redpandaai.co/api/file-base64-upload}

if [ "${DRY_RUN:-0}" = 1 ]; then
  echo "POST $API/jobs/createTask model=$MODELO campos=$CAMPOS inicio=$INI fim=$FIM segundos=$SEG"
  exit 0
fi
KEY=$(chave KIE_API_KEY "${KIE_ENV_FILE:-}")
[ -n "$KEY" ] || { echo "kie: KIE_API_KEY não definida" >&2; exit 2; }
mkdir -p "$(dirname "$OUT")"

subir() {
  if [ -n "${KIE_SUBIR:-}" ]; then $KIE_SUBIR "$1"; return; fi
  python3 - "$UPLOAD" "$KEY" "$1" <<'PY'
import base64, json, os, sys, urllib.request
up, key, p = sys.argv[1:]
corpo = {'base64Data': 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode(),
         'uploadPath': 'site-movimento', 'fileName': os.path.basename(p)}
r = json.load(urllib.request.urlopen(urllib.request.Request(up, json.dumps(corpo).encode(),
    {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}), timeout=120))
d = r.get('data') or {}
print(d.get('downloadUrl') or d.get('fileUrl') or d.get('url') or '')
PY
}
U_INI=$(subir "$INI"); [ -n "$U_INI" ] || { echo "kie: não consegui URL pública do início" >&2; exit 1; }
U_FIM=""; [ "$FIM" = "-" ] || U_FIM=$(subir "$FIM")

python3 - "$API" "$KEY" "$MODELO" "$CAMPOS" "$PROMPT" "$SEG" "$U_INI" "$U_FIM" "$OUT" <<'PY'
import json, sys, time, urllib.request
api, key, modelo, campos, prompt, seg, ui, uf, out = sys.argv[1:]
c = json.loads(campos)
H = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}
entrada = {c['prompt']: prompt, c['inicio']: ui, c['duracao']: str(round(float(seg)))}
if uf:
    entrada[c['fim']] = uf
r = json.load(urllib.request.urlopen(urllib.request.Request(api + '/jobs/createTask',
    json.dumps({'model': modelo, 'input': entrada}).encode(), H), timeout=120))
open(out + '.json', 'w').write(json.dumps(r))
tid = (r.get('data') or {}).get('taskId') or r.get('taskId')
if not tid:
    sys.exit('kie: resposta sem taskId: ' + json.dumps(r)[:300])
for _ in range(180):
    time.sleep(10)
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(f'{api}/jobs/recordInfo?taskId={tid}', headers=H), timeout=60))
    except Exception:
        continue
    dd = d.get('data') or {}
    st = str(dd.get('state') or dd.get('status') or '').lower()
    if st in ('success', 'completed'):
        open(out + '.json', 'w').write(json.dumps(d))
        res = dd.get('resultJson')
        res = json.loads(res) if isinstance(res, str) else (res or {})
        urls = res.get('resultUrls') or res.get('videoUrls') or []
        if not urls:
            sys.exit('kie: concluído sem URL: ' + json.dumps(d)[:300])
        req = urllib.request.Request(urls[0], headers={'User-Agent': 'Mozilla/5.0'})
        open(out, 'wb').write(urllib.request.urlopen(req, timeout=600).read())
        sys.exit(0)
    if st in ('fail', 'failed', 'error'):
        sys.exit('kie: job falhou: ' + json.dumps(d)[:300])
sys.exit('kie: tempo esgotado esperando ' + tid)
PY
ultimo_quadro "$OUT"
anotar kie "$MODELO/${SEG}s" "?" "$OUT" "$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print((d.get('data') or {}).get('taskId',''))" "$OUT.json")"
echo "OK $OUT"
