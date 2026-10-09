# Funções comuns dos motores (source, não executar).
# Contrato: motores/<motor>.sh <inicio.png> <fim.png|-> "<prompt>" <segundos> <saida.mp4>
#   saída: <saida.mp4>, <saida.mp4>.json (resposta crua do serviço) e <saida>.ultimo.png
#   variáveis comuns: DRY_RUN=1 (só mostra o que faria), LEDGER=<arquivo.tsv> (anota cada job)

contrato_args() {
  [ $# -eq 5 ] || { echo "uso: $(basename "$0") <inicio.png> <fim.png|-> \"<prompt>\" <segundos> <saida.mp4>" >&2; exit 2; }
  [ -s "$1" ] || { echo "início não existe: $1" >&2; exit 2; }
  [ "$2" = "-" ] || [ -s "$2" ] || { echo "fim não existe: $2" >&2; exit 2; }
  [ -n "$3" ] || { echo "prompt vazio" >&2; exit 2; }
  python3 -c "import sys; float(sys.argv[1])" "$4" 2>/dev/null || { echo "segundos inválido: $4" >&2; exit 2; }
}

# Baixa uma URL para um arquivo com User-Agent de navegador (alguns CDNs recusam o padrão).
baixar() {
  python3 - "$1" "$2" <<'PY'
import sys, urllib.request
u, o = sys.argv[1:]
r = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
open(o, 'wb').write(urllib.request.urlopen(r, timeout=600).read())
PY
}

# Último quadro real do clipe: é dele que o próximo clipe começa (nunca do keyframe).
ultimo_quadro() { ffmpeg -v error -y -sseof -0.1 -i "$1" -frames:v 1 -update 1 "${1%.mp4}.ultimo.png"; }

# Primeira URL de vídeo encontrada num texto/JSON.
achar_url_video() {
  python3 - "$1" <<'PY'
import re, sys
t = open(sys.argv[1]).read()
us = [u.rstrip('.,') for u in re.findall(r'https?://[^\s"\'<>\\]+', t) if re.search(r'\.(mp4|mov|webm)', u.lower())]
print(us[-1] if us else '')
PY
}

anotar() {  # anotar <motor> <descricao> <custo> <saida> <ref>
  [ -n "${LEDGER:-}" ] && printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$(date -Is)" "$1" "$2" "$3" "$4" "$5" >> "$LEDGER"
  return 0
}

# Lê uma variável de ambiente ou de um arquivo .env indicado em <VAR>_ENV_FILE, sem imprimir o valor.
chave() {
  local nome=$1 arq=${2:-}
  if [ -n "${!nome:-}" ]; then printf '%s' "${!nome}"; return; fi
  [ -n "$arq" ] && [ -r "$arq" ] && grep -E "^${nome}=" "$arq" | tail -1 | cut -d= -f2- | tr -d '"'"'"
}
