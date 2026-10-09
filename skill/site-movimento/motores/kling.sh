#!/usr/bin/env bash
# Motor KLING — pela assinatura (CLI `kling`, login OAuth uma vez com `kling login`), sem chave de API.
#
# Contrato comum dos motores (ver motores/README.md):
#   motores/kling.sh <inicio.png> <fim.png|-> "<prompt>" <segundos> <saida.mp4>
#   → <saida.mp4>, <saida.mp4>.json (resposta crua, com o id do job) e <saida>.ultimo.png
#
# Modelo kling-video-v3_0: o único da conta com quadro final (tail_image) e duração livre 3–15 s.
# Medido (08/10/2026): 720p com quadro final é aceito (o servidor anuncia "exige 1080p"), fixa os dois
# lados (0,99 / 0,91–0,99 em fixacao.py) e custa 30 créditos por clipe de 5 s sem áudio.
# O servidor liga prefer_multi_shots e áudio por padrão: os dois vão desligados aqui.
# Variáveis: KLING_MODELO, KLING_RESOLUCAO (720p|1080p, padrão 720p), KLING_POLL (s, padrão 900),
#            DRY_RUN=1, LEDGER=<arquivo.tsv>.
# O job é PAGO e não cancela: a resposta crua é gravada antes de procurar a URL.
set -euo pipefail
source "$(dirname "$0")/_comum.sh"
contrato_args "$@"
INI=$1; FIM=$2; PROMPT=$3; SEG=$4; OUT=$5
MODELO=${KLING_MODELO:-kling-video-v3_0}; RES=${KLING_RESOLUCAO:-720p}; POLL=${KLING_POLL:-900}
KLING=${KLING_BIN:-$(command -v kling || echo ~/.npm-global/bin/kling)}
SEG=$(python3 -c "import sys;print(max(3,min(15,round(float(sys.argv[1])))))" "$SEG")

cmd=("$KLING" image_to_video --image "$INI")
[ "$FIM" = "-" ] || cmd+=(--tailImage "$FIM")
cmd+=(--model "$MODELO" --duration "$SEG" --resolution "$RES" --enable_audio false --prefer_multi_shots false --poll "$POLL" -q "$PROMPT")
if [ "${DRY_RUN:-0}" = 1 ]; then printf '%q ' "${cmd[@]}"; echo; exit 0; fi

saldo() { "$KLING" account -q 2>/dev/null | python3 -c "import json,sys;print(json.load(sys.stdin)['body']['availableRemainCredits'])" 2>/dev/null || echo "?"; }
mkdir -p "$(dirname "$OUT")"
antes=$(saldo)
"${cmd[@]}" > "$OUT.json" 2>&1 < /dev/null || true
url=$(achar_url_video "$OUT.json")
if [ -z "$url" ]; then
  echo "kling: sem URL de vídeo (resposta crua em $OUT.json; com o generation_id dá para buscar com 'kling query_tasks')" >&2
  exit 1
fi
baixar "$url" "$OUT"
ultimo_quadro "$OUT"
depois=$(saldo)
gasto=$(python3 -c "print(round($antes-$depois,2))" 2>/dev/null || echo "?")
anotar kling "$MODELO/$RES/${SEG}s" "$gasto" "$OUT" "$url"
echo "OK $OUT (créditos: $antes → $depois, gasto $gasto)"
