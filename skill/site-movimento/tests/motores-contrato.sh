#!/usr/bin/env bash
# Confere que os 4 motores seguem o mesmo contrato SEM chamar nenhum serviço (DRY_RUN=1):
#   - recusam argumentos errados (saída 2);
#   - aceitam o contrato <inicio> <fim|-> "<prompt>" <segundos> <saida.mp4> e mostram o que fariam.
set -uo pipefail
R=$(cd "$(dirname "$0")/.." && pwd)
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
python3 -c "from PIL import Image; Image.new('RGB',(64,36),(20,20,20)).save('$T/a.png'); Image.new('RGB',(64,36),(200,120,40)).save('$T/b.png')"
ok=0; total=0
for m in kling agnes kie custom; do
  total=$((total+1)); erros=""
  bash "$R/motores/$m.sh" >/dev/null 2>&1; [ $? -eq 2 ] || erros+=" sem-args≠2"
  bash "$R/motores/$m.sh" "$T/nao.png" "$T/b.png" "p" 5 "$T/o.mp4" >/dev/null 2>&1; [ $? -eq 2 ] || erros+=" início-inexistente≠2"
  extra=(); [ "$m" = custom ] && extra=(env MOTOR_CMD='meu-cli --a {inicio} --b {fim} --p {prompt} --s {segundos} --o {saida}')
  saida=$(DRY_RUN=1 "${extra[@]}" bash "$R/motores/$m.sh" "$T/a.png" "$T/b.png" "slow push in" 5 "$T/o.mp4" 2>&1); rc=$?
  [ $rc -eq 0 ] || erros+=" dry-run rc=$rc"
  echo "$saida" | grep -q "a.png" || erros+=" dry-run-não-mostra-início"
  [ -e "$T/o.mp4" ] && erros+=" dry-run-criou-arquivo"
  if [ -z "$erros" ]; then ok=$((ok+1)); echo "OK $m"; else echo "FALHA $m:$erros"; echo "   $saida" | head -2; fi
done
echo "$ok/$total motores OK"
[ $ok -eq $total ]
