#!/usr/bin/env bash
# Gera o filme inteiro a partir de <pasta>/roteiro.json, um clipe por vez, com o motor escolhido.
#
# Uso: MOTOR=kling|agnes|kie|custom scripts/filme.sh <pasta-do-filme>
#
# roteiro.json:
#   {"vetor": "the camera only ever pushes further in",
#    "segundos": 5,
#    "clipes": [{"id":"c1","inicio":"kf/kf01.png","fim":"kf/kf02.png","prompt":"..."}, ...]}
#
# Regras (não negociáveis):
#   - estritamente em ordem, nunca em paralelo;
#   - o clipe 1 começa no seu keyframe; o clipe N>1 começa no ÚLTIMO QUADRO REAL do clipe N-1
#     (pixels extraídos, nunca o keyframe) e termina no keyframe seguinte;
#   - depois de cada clipe: fixacao.py (o motor respeitou os quadros?) e cortes.py (corte escondido?).
#     Corte escondido PARA a cadeia (saída 3): aproxime os keyframes e refaça, não emende com fade;
#   - retomável: clipe que já está no disco é pulado.
# Rode vetor.py no roteiro antes de gastar qualquer crédito.
set -uo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
D=${1:?uso: MOTOR=<motor> filme.sh <pasta-do-filme>}
MOTOR=${MOTOR:-kling}
M="$AQUI/../motores/$MOTOR.sh"
[ -x "$M" ] || [ -r "$M" ] || { echo "motor desconhecido: $MOTOR (veja motores/)"; exit 1; }
[ -r "$D/roteiro.json" ] || { echo "falta $D/roteiro.json"; exit 1; }
cd "$D" || exit 1; mkdir -p clipes
export LEDGER=${LEDGER:-$PWD/../ledger.tsv}
N=$(python3 -c "import json;print(len(json.load(open('roteiro.json'))['clipes']))")
SEG=$(python3 -c "import json;print(json.load(open('roteiro.json')).get('segundos',5))")
echo "filme: $N clipes de ${SEG}s no motor $MOTOR"
ANT=""
for ((i=0; i<N; i++)); do
  IFS=$'\t' read -r ID INI FIM PROMPT <<< "$(python3 -c "
import json;c=json.load(open('roteiro.json'))['clipes'][$i]
print('\t'.join([c['id'],c['inicio'],c['fim'],' '.join(c['prompt'].split())]))")"
  [ -n "$ANT" ] && INI="$ANT"
  if [ -s "clipes/$ID.mp4" ]; then echo "[$ID] já existe, pulando"; ANT="clipes/$ID.ultimo.png"; continue; fi
  echo "[$ID] início=$INI fim=$FIM"
  bash "$M" "$INI" "$FIM" "$PROMPT" "$SEG" "clipes/$ID.mp4" || { echo "[$ID] o motor falhou (veja clipes/$ID.mp4.json)"; exit 1; }
  python3 "$AQUI/fixacao.py" "clipes/$ID.mp4" "$INI" "$FIM" || echo "[$ID] ATENÇÃO: o motor não respeitou os quadros; olhe antes de seguir"
  python3 "$AQUI/cortes.py" "clipes/$ID.mp4" || {
    echo "[$ID] CORTE ESCONDIDO dentro do clipe. Não use. Aproxime os keyframes, mantenha o eixo,"
    echo "      apague clipes/$ID.mp4 e rode de novo."; exit 3; }
  ANT="clipes/$ID.ultimo.png"
done
echo "FILME PRONTO — próximo: python3 $AQUI/montar.py <site> clipes/c1.mp4:0:-1 clipes/c2.mp4:1:-1 ..."
