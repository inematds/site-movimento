# Motores de vídeo

Todos seguem o mesmo contrato, então trocar de motor é trocar uma palavra (`MOTOR=kling|agnes|kie|custom`):

```
motores/<motor>.sh <inicio.png> <fim.png|-> "<prompt>" <segundos> <saida.mp4>
```

Saída: `<saida.mp4>`, `<saida.mp4>.json` (resposta crua do serviço, com o id do job, gravada antes de
qualquer leitura) e `<saida>.ultimo.png` (o último quadro real, de onde o próximo clipe começa).

Variáveis comuns: `DRY_RUN=1` (mostra o que faria, não chama nada) e `LEDGER=<arquivo.tsv>` (anota
data, motor, modelo, custo, arquivo e id de cada job).

| Motor | Como autentica | Fixa início e fim | Observações medidas |
|---|---|---|---|
| `kling.sh` | CLI `kling` pela assinatura (`kling login` uma vez) | sim | v3.0, 720p, 30 créditos por 5 s; multi-shots e áudio desligados |
| `agnes.sh` | `AGNES_API_KEY` | sim (interpolação entre os dois) | prompt em inglês; 503 transitórios; ~1 vídeo/min; 8n+1 quadros; medido: pontas 0,91, meio vira metamorfose |
| `kie.sh` | `KIE_API_KEY` | depende do modelo (`KIE_MODELO`, `KIE_CAMPOS`) | imagens viram URL pública (upload do serviço ou `KIE_SUBIR`) |
| `custom.sh` | o que o seu comando precisar | depende | `MOTOR_CMD` com `{inicio} {fim} {prompt} {segundos} {saida}` |

Imagem (keyframes): `imagem_local.py` usa o servidor local de imagem (`IMG_API`, padrão
`http://localhost:8000`, modelo `flux2-klein`), sem custo. `--ref` passa imagens de referência.

## Antes de encadear um filme inteiro num motor novo

```bash
bash motores/<motor>.sh kf/kf01.png kf/kf02.png "slow dolly forward..." 5 teste/c1.mp4
python3 scripts/fixacao.py teste/c1.mp4 kf/kf01.png kf/kf02.png    # precisa dar FIXA (≥ 0,90 nos dois lados)
python3 scripts/cortes.py teste/c1.mp4                             # sem corte escondido
```

Se o início não fixar, o motor serve para um filme único, não para o topo encadeado.

## Teste do contrato (não chama serviço nenhum)

```bash
bash tests/motores-contrato.sh     # → 4/4 motores OK
```

## Escrever um motor novo

Copie `custom.sh`, troque o miolo pela chamada do seu serviço e mantenha: `source _comum.sh`,
`contrato_args "$@"`, `DRY_RUN`, gravar a resposta crua em `$OUT.json` antes de qualquer parse,
`ultimo_quadro "$OUT"` e `anotar`.
