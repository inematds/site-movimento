#!/usr/bin/env bash
# Portão: nenhum arquivo publicável cita a origem do método (pessoas, comunidade, ferramentas de
# terceiros, links de afiliado) nem os nomes antigos dos scripts. Roda antes de todo push.
# Uso: tests/sem-fonte.sh [pasta=raiz do repo]   → "0 ocorrências" e saída 0
set -uo pipefail
RAIZ=${1:-$(cd "$(dirname "$0")/.." && pwd)}
PADRAO='higgsfield|seedance|nano[ _-]?banana|bit\.ly|fandf\.co|notion\.(so|com)|skool|super website|motion[- ]site[- ]studio|slopmonster|design-loop skill|automation[- ]vault|aiautomations|mongodb|glido|cutscan|smoothjoin|assemble_segs|vector-check|kf_chain|gen_clip|gen_loop|continuity-gate|copy-gate|\bjack\b|refero|mobbin|savee'
# Arquivos rastreados ou novos (ignora o que o .gitignore exclui) + mensagens de commit.
cd "$RAIZ" || exit 2
LISTA=$(git ls-files -co --exclude-standard 2>/dev/null | grep -v -E '^(tests/sem-fonte\.sh|longrun/)' || true)
ACHOU=0
if [ -n "$LISTA" ]; then
  R=$(printf '%s\n' "$LISTA" | tr '\n' '\0' | xargs -0 grep -I -n -i -E "$PADRAO" 2>/dev/null || true)
  if [ -n "$R" ]; then printf '%s\n' "$R" | head -40; ACHOU=$(printf '%s\n' "$R" | wc -l); fi
fi
LOG=$(git log --format=%B 2>/dev/null | grep -i -E "$PADRAO" || true)
[ -n "$LOG" ] && { echo "mensagens de commit:"; echo "$LOG" | head; ACHOU=$((ACHOU + $(echo "$LOG" | wc -l))); }
echo "$ACHOU ocorrências"
[ "$ACHOU" -eq 0 ]
