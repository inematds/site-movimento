#!/usr/bin/env bash
# Motor CUSTOM — use QUALQUER IA de vídeo que você já tem (outro serviço, um modelo local, um script seu).
#
# Defina MOTOR_CMD com o comando que gera UM clipe. Marcadores trocados antes de rodar:
#   {inicio} {fim} {prompt} {segundos} {saida}
# ({fim} vira vazio quando o clipe não tem quadro final.)
# Exemplos:
#   MOTOR_CMD='python3 ~/meu_ltx.py --first {inicio} --last {fim} --text {prompt} --sec {segundos} --out {saida}'
#   MOTOR_CMD='meu-cli video --start {inicio} --end {fim} -p {prompt} -o {saida}'
#
# A única exigência: ao terminar, {saida} precisa ser um MP4. O resto (último quadro, ledger,
# conferência de fixação e de cortes) a skill faz igual para todos os motores.
set -euo pipefail
source "$(dirname "$0")/_comum.sh"
contrato_args "$@"
INI=$1; FIM=$2; PROMPT=$3; SEG=$4; OUT=$5
[ -n "${MOTOR_CMD:-}" ] || { echo "custom: defina MOTOR_CMD (veja o cabeçalho deste arquivo)" >&2; exit 2; }
[ "$FIM" = "-" ] && FIM=""
CMD=$(python3 - "$MOTOR_CMD" "$INI" "$FIM" "$PROMPT" "$SEG" "$OUT" <<'PY'
import shlex, sys
modelo, ini, fim, prompt, seg, out = sys.argv[1:]
for k, v in (('inicio', ini), ('fim', fim), ('prompt', prompt), ('segundos', seg), ('saida', out)):
    modelo = modelo.replace('{' + k + '}', shlex.quote(v) if v else "''")
print(modelo)
PY
)
if [ "${DRY_RUN:-0}" = 1 ]; then echo "$CMD"; exit 0; fi
mkdir -p "$(dirname "$OUT")"
bash -c "$CMD" > "$OUT.json" 2>&1 || { echo "custom: o comando falhou (saída em $OUT.json)" >&2; exit 1; }
[ -s "$OUT" ] || { echo "custom: o comando terminou mas $OUT não existe" >&2; exit 1; }
ultimo_quadro "$OUT"
anotar custom "${MOTOR_CMD%% *}/${SEG}s" "?" "$OUT" "-"
echo "OK $OUT"
