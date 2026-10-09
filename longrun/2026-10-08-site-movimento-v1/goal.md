# Goal — site-movimento-v1

- **Início:** 2026-10-08 20:00 · **Agente:** Claude (sessão interativa)
- **Tetos:** tempo 8 h · Kling ≤ 800 créditos no piloto (saldo inicial 5255,8) · memória: preview/render em `systemd-run` 8G

## Resultado
Skill nova `site-movimento` (site cujo topo é um filme que anda com a rolagem + motion graphics em código,
motor de vídeo trocável: kling | agnes | kie | custom | código puro), projeto público `inematds/site-movimento`
com piloto (cópia da home do eventos.inema.pro com filme Kling), 15 peças novas no inema-motion-lab,
análise de delegação Haiku × topo, guia PT/EN/ES e card no portal.

## Critérios de pronto (verificáveis)

**Função**
- [ ] `bash tests/sem-fonte.sh` (site-movimento e inema-motion-lab) → `0 ocorrências`, exit 0
- [ ] `ls motores/{kling,agnes,kie,custom}.sh` → 4 arquivos; `bash tests/motores-contrato.sh` → 4/4 OK (dry-run: valida args, monta comando, não chama)
- [ ] `python3 scripts/cutscan.py piloto/eventos/assets/*.mp4` → exit 0
- [ ] `bash scripts/continuity-gate.sh piloto/eventos/frames 4` → PASS
- [x] `node tests/piloto-secoes.cjs` + `scripts/verificar.js jank` → 0 erros de console, jank máx < 50 ms, Off/On/X-ray funcionam, sem rolagem horizontal em 390 px
- [ ] `cd ~/projetos/inema-motion-lab && node tools/testar-pecas.cjs` → `20/20 peças OK`
- [ ] `python3 ~/.claude/skills/skill-creator-plus/scripts/validate_skill.py ~/.claude/skills/site-movimento` (ou validador equivalente) → OK
- [ ] `docs/DELEGACAO-MODELOS.md` com tabela medida (peças Haiku × topo: 1ª passada no teste, nº de correções; críticos Haiku × topo no piloto)
- [ ] `curl -s -o /dev/null -w '%{http_code}' https://inematds.github.io/site-movimento/guia/` (e `/en/`, `/es/`) → 200
- [ ] portal: commit com o card no `origin` (hash no relatório)

**Regressão**
- [ ] `~/.claude/skills/scroll-film-studio/SKILL.md` continua lá (só ganha 1 linha apontando a nova)
- [ ] `cd ~/projetos/inemaeventos && git status --short` → igual ao início (não mexer)
- [ ] 5 peças antigas do motion-lab continuam OK no `testar-pecas`

**Limite**
- [ ] `kling account -q` antes − depois ≤ 800 e igual à soma do `ledger.tsv`
- [ ] Agnes e Kie: zero chamadas (só construídos; sem autorização de API nesta rodada)
- [ ] Nada de `_fonte/` do opus55-motion-design dentro de repo público

**Teste rápido por ciclo:** `bash tests/sem-fonte.sh && bash tests/motores-contrato.sh`
**Teste completo no final:** os itens acima, em ordem.

## Restrições
- Kling SÓ pela CLI `kling` (assinatura). Agnes/Kie: não chamar.
- Sem referências à fonte (nomes, links, Higgsfield, comunidade) em nada público, nem em mensagens de commit.
- não mexer em: repo `inemaeventos`, site no ar, `scroll-film-studio` (além de 1 linha).

## Portões humanos (parar e perguntar)
- piloto passar de 800 créditos Kling
- Agnes/Kie por API
- conflito no portal (árvore suja de outra sessão)
