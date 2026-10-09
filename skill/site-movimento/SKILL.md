---
name: site-movimento
description: >-
  Site em movimento: o topo da página é UM plano de câmera contínuo que anda com a rolagem (vídeo
  gerado por IA, encadeado quadro a quadro, sem pulos) e cada seção abaixo tem um gráfico animado em
  código que explica o que ela diz, com a chave Parado / Ligado / Raio-X. Motor de vídeo trocável:
  kling (assinatura), agnes, kie, custom (qualquer IA do usuário) ou código puro (sem custo).
  Gatilhos: "/site-movimento", "site que vira filme na rolagem", "site com vídeo na rolagem",
  "hero que anda com o scroll", "site 3D com IA", "site em movimento", "scroll film".
  NÃO é para: filme de marca a partir de um site existente (isso é filmarca), slides, vídeo
  explicativo, landing estática.
---

# Site em movimento

Você constrói um **site em movimento**: o topo é um filme que avança quadro a quadro conforme a
pessoa rola, as seções abaixo têm cada uma um gráfico animado que prova o que a seção diz, e uma
chave no canto mostra **Parado**, **Ligado** ou **Raio-X** (que etiqueta o que é vídeo de IA e o que
é código, com o custo).

É um **processo, não um molde**. Não há página para copiar: cada site é desenhado do zero para o seu
assunto. O que é compartilhado é o motor (`runtime/`), os scripts (`scripts/`) e os motores de vídeo
(`motores/`).

`S=<pasta desta skill>` nos comandos abaixo.

---

## Os sete passos (em ordem, sem pular)

| # | Passo | Você produz | Portão antes do próximo |
|---|---|---|---|
| 1 | **Referências** | `refs/`, `refs/notas.md`, `barra.md` (5 a 7 mecanismos) | a pessoa viu a `barra.md` |
| 2 | **Entrevista + conceito** | `BRIEF.md`, `sistema.md`, `filme/roteiro.json`, orçamento | a pessoa disse sim ao orçamento |
| 3 | **Keyframes** | `kf/*.png` encadeados | `folha_kf.py`: nenhum keyframe vira a câmera; você olhou todos |
| 4 | **Vídeo** | `filme/clipes/`, `loops/`, `site/frames/` | `vetor.py` PASSA, `fixacao.py` FIXA, `cortes.py` limpo, `continuidade.py` PASSA |
| 5 | **Página + camada de movimento** | `site/index.html` | um gráfico animado por seção; a chave funciona nos 3 modos |
| 6 | **Críticos** | `progresso.md` | os 3 críticos dizem PASSA |
| 7 | **Texto + verificação** | `fotos/`, relatório | `portao-texto.js` sai 0, jank máx < 50 ms, 0 erro no console |

---

## Regra de ouro: gosto fica no modelo forte; o resto é delegado com critério

As decisões de gosto (leitura das referências, conceito, direção de arte, paleta, tipografia,
layout, desenho do movimento, texto, revisão final) ficam com o modelo mais forte disponível.
O trabalho mecânico vai para scripts sem modelo (ffmpeg, SSIM, extração de quadros, capturas,
ledger). Tarefas fechadas com contexto limpo vão para subagentes (parceiro que ataca o conceito,
construtor de uma peça, os 3 críticos).

**O que pode ir para um modelo menor (medido, não opinião): ver `referencias/7-delegacao.md`.**

Cada site é único: nunca reaproveite a página de outro site. O motor e os scripts são comuns; a
página nunca é.

---

## Preparar (um bloco só, antes do passo 1)

```bash
S=~/.claude/skills/site-movimento
export TRABALHO=~/projetos/output/site-movimento/<slug>      # uma pasta por site; o ledger mora aqui
mkdir -p "$TRABALHO"/{refs,kf,filme,loops,site,criticos,fotos}
command -v ffmpeg ffprobe python3 node >/dev/null && echo ferramentas-ok
python3 -c "import numpy, PIL" 2>/dev/null || pip install numpy pillow             # SSIM, folhas, quadros
node -e "require('$S/scripts/_browser.js')" && echo navegador-ok           # Playwright (se faltar: cd $S/scripts && npm install && npx playwright install chromium)
bash $S/tests/motores-contrato.sh                                           # motores respondem ao contrato
```

Diga o que funciona e o que falta. Depois pergunte (em texto, junto com a entrevista) **qual motor
de vídeo** usar:

| Motor | Como entra | Fixa início E fim? | Custo medido |
|---|---|---|---|
| `kling` | CLI `kling` pela assinatura (login OAuth, sem chave) | **sim** (v3.0, medido 0,99 / 0,91) | 30 créditos por clipe de 5 s em 720p |
| `agnes` | `AGNES_API_KEY` | sim (modo keyframes, interpola) | sem custo por clipe; ~1 vídeo/min |
| `kie` | `KIE_API_KEY` (a chave da pessoa) | depende do modelo escolhido | o preço do modelo no Kie |
| `custom` | `MOTOR_CMD` = qualquer IA da pessoa | depende | depende |
| código | nenhum | n/a | zero |

Chave de API só com autorização explícita da pessoa para aquele serviço. Sem motor, o site sai em
código puro (passo 4 alternativo no fim) e você diz isso com clareza.

**Uma construção longa passa por compactação de contexto.** Instrução no chat some; arquivo fica.
Mantenha o `BRIEF.md` atualizado (motor, caminhos dos quadros, número de quadros, cor da emenda,
o que não fazer, as notas da pessoa).

---

## PASSO 1: referências primeiro

A pessoa traz de 3 a 10 referências (imagens, links de sites, posts). Sem referência, proponha três
(uma linha cada, por quê) e siga com a mais exigente se ela não escolher.

Olhe os **pixels**, nunca uma descrição:
- Imagem: salve em `refs/` e veja reduzida (< 100 KB): `python3 -c "from PIL import Image as I;i=I.open('a.png');i.thumbnail((900,900));i.convert('RGB').save('refs/ver/a.jpg',quality=80)"`.
- Site no ar: `node $S/scripts/capturar.js <url> refs/<nome>` (10 quadros do primeiro ecrã em 4 s,
  a página inteira em passos de rolagem e `page.json` com fontes, cores, títulos, canvas/vídeo/WebGL).
- Vídeo: 8 quadros espalhados: `D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ref.mp4); ffmpeg -i ref.mp4 -vf "fps=8/$D,scale=900:-2" refs/<nome>_%02d.jpg`.

Escreva `refs/notas.md` (uma linha por referência: o que vale roubar) e destile em **5 a 7
mecanismos** na `barra.md` — mecanismos, não adjetivos; cada linha verificável olhando uma captura.
Formato e exemplos: `referencias/1-referencias.md`.

Mostre a `barra.md` **na mesma mensagem da entrevista**.

---

## PASSO 2: entrevista (um lote, perguntas curtas, em texto)

Pergunte tudo de uma vez, em texto livre (nunca menu). Toda pergunta aceita "você decide".

1. **Assunto.** Nome, o que oferece, para quem. Logo, cores e fontes se houver.
2. **Clima.** Uma linha.
3. **A viagem.** O plano contínuo: onde a câmera começa e onde termina. É o coração do site.
4. **Seções.** De 3 a 6 abaixo do filme, e a única coisa que cada uma precisa provar.
5. **A ação.** A única coisa que a pessoa deve fazer, e para onde leva.
6. **Motor e orçamento.** Qual motor (tabela acima) e o tamanho:

| Plano | Keyframes | Filme | Loops | Kling 720p (medido) |
|---|---|---|---|---|
| Prova | 4 | 3 clipes × 5 s | 1 | **120 créditos** |
| Padrão | 6 | 5 clipes × 5 s | 2 | **210 créditos** |
| Completo | 8 | 7 clipes × 5 s | 4 | **330 créditos** |

Keyframes no gerador local (flux2-klein) não custam nada. Some ~15% para refazer. Confira o preço
real antes de cotar (`kling account -q` antes e depois de um clipe de teste).

7. **Extras.** Mascote na página? Onde vai ser publicado?

**Depois proponha dois conceitos** (três no máximo), o recomendado primeiro. Cada um: um nome e o
passeio concreto do topo até a ação, com plano e custo. Antes de mostrar, um **subagente novo** que
vê só os conceitos, o assunto e a `barra.md` ataca: a viagem é um movimento ou quatro cenas em fila?
Dá para fazer em N passos pequenos? Toda seção tem o que animar? E um ângulo inesperado. Incorpore
o que sobreviver. Esse parceiro nunca escreve texto, código ou design.

Quando a pessoa escolher (ou disser "você decide"), grave:
- `BRIEF.md`: assunto, clima, viagem, seções, ação, motor, orçamento, as palavras exatas da pessoa, o que não fazer.
- `sistema.md`: paleta (hex exatos), par de fontes com personalidade (Google Fonts), escala de tipo,
  espaçamento, raios, regras de movimento (durações, curvas, o que pode mexer junto).
- `filme/roteiro.json`: o **vetor** (uma frase com o sentido único do filme) e N−1 clipes para N keyframes.
- **O orçamento**, linha a linha, e o saldo atual. **Sim explícito antes de gastar um crédito.**

---

## PASSO 3: keyframes (encadeados, um passo pequeno por vez)

A lei que decide se o filme pode ser feito sem pulos: **mesma superfície, mesmo eixo de câmera,
passos pequenos, uma mudança por passo** (escala, OU lugar, OU luz).

Caminho padrão, sem custo — **aproximação encadeada** (medido no piloto):
```bash
python3 $S/motores/imagem_local.py kf/kf01.png "<cena de abertura + sufixo de estilo>" --largura 1280 --altura 720
python3 $S/scripts/kf_aproxima.py kf/kf01.png kf/kf02.png "<a cena nessa distância + sufixo>" --fator 1.8 --centro 0.5,0.48
python3 $S/scripts/kf_aproxima.py kf/kf02.png kf/kf03.png "..." --fator 1.8 --centro 0.5,0.47
python3 $S/scripts/folha_kf.py kf/        # folha numerada < 100 KB + notas entre vizinhos
```
Por quê: modelos de edição, quando o prompt diz "a câmera andou para frente", devolvem a referência
quase igual. Recortar o centro e ampliar garante o mesmo eixo e um passo de tamanho controlado;
o modelo só redesenha o detalhe que aparece mais perto. Para recuar (filme "para fora"), gere o
keyframe mais fechado primeiro e use `--fator` no sentido contrário (gere do fim para o começo).

Alternativas: Codex `image_gen` para o keyframe de abertura (texto bem desenhado), ou o gerador de
imagem do próprio motor de vídeo quando a pessoa preferir (custa crédito).

**Olhe a folha e refaça** qualquer keyframe que vire a câmera, mude de lugar ou de luz.
Refazer um keyframe custa segundos; um clipe que pula custa créditos.
**Procure letras ampliando** (placas, painéis, telas): o modelo de imagem desenha texto mesmo com
"no text" no prompt, e o vídeo só deixa a letra maior e mais torta conforme a câmera chega perto.
Letra num keyframe vira letra deformada no filme; redesenhe com outra semente ou pinte o trecho
com a cor lisa vizinha. No piloto, "Departures" no kf03 custou um clipe refeito à toa.

**Celular (9:16):** derive cada keyframe vertical do horizontal correspondente, com o mesmo eixo:
`kf_aproxima.py kf/kf0N.png kf-v/kf0Nv.png "<cena + Vertical portrait frame>" --fator 1 --largura 720 --altura 1280`.
O motor gera vídeo na proporção da imagem de entrada; monte com `montar.py --vertical` (vai para
`frames-v/`) e a página escolhe `frames-v/` no celular em pé.

Detalhes, sufixo de estilo e
filtro de segurança: `referencias/2-motores.md`.

---

## PASSO 4: vídeo (encadeado, sem pulos)

1. **Confira o sentido antes de gastar:** `python3 $S/scripts/vetor.py filme/roteiro.json` precisa PASSAR.
   Leia cada prompt de clipe ao lado dos seus dois keyframes como uma frase: este texto me leva da
   primeira imagem à segunda?
2. **Gere em ordem, nunca em paralelo, em background:**
   `MOTOR=kling bash $S/scripts/filme.sh filme/` — o clipe N>1 começa no **último quadro real** do
   anterior (pixels extraídos, nunca o keyframe) e termina no keyframe seguinte. Depois de cada clipe
   roda `fixacao.py` (o motor respeitou os quadros?) e `cortes.py` (corte escondido?). Retomável.
3. **Clipe com corte escondido nunca é usado.** Não compre um clipe-ponte (pontes cortam de novo) e
   não esconda com fade ou flash (a pessoa para de rolar exatamente ali). Aproxime os keyframes e refaça.
4. **Monte e suavize:**
   `python3 $S/scripts/montar.py site filme/clipes/c1.mp4:0:-1 filme/clipes/c2.mp4:1:-1 ...`
   (do clipe 2 em diante, comece no quadro 1), depois `python3 $S/scripts/suavizar.py site`, depois
   `python3 $S/scripts/continuidade.py site/frames 4` precisa PASSAR.
5. **Loops começam e terminam na mesma imagem:**
   `MOTOR=kling bash $S/scripts/loop.sh loops/<nome>.mp4 <imagem.png> "<movimento que volta>"`.
   Costura visível: `python3 $S/scripts/loopfix.py loops/<nome>.mp4`.

Leis medidas, números e armadilhas de cada motor: `referencias/2-motores.md`.

---

## PASSO 5: a página e a camada de movimento

Escreva `site/sistema.md` primeiro (o crítico de sistema julga a página contra ele). Depois
`site/index.html` do zero, fiel à `barra.md`.

```bash
mkdir -p site/vendor && cp $S/runtime/*.js site/vendor/
```
- **O filme:** `MotorRolagem`/`MotionEngine.Scrub` de `vendor/motor-rolagem.js` (canvas + todos os
  quadros JPEG + janela deslizante de ImageBitmap + cabeça de leitura suavizada). Nunca role um `<video>`.
- **Loops:** `<video muted playsinline loop autoplay>`, primeiro quadro = último.
- **Um gráfico animado por seção, em código** (canvas, SVG, CSS), que explica a seção. Seção que é só
  texto e imagem parada reprova. Antes de inventar, procure no catálogo do **INEMA Motion Lab**
  (`referencias/4-camada-movimento.md`): 20 peças prontas (busca ⌘K, bento, rodapés com física,
  menu que se transforma, galeria giratória...), todas com `data-xray`.
- **A chave Parado / Ligado / Raio-X** vai em todo site: `vendor/chave-movimento.js`, e todo elemento
  que se move recebe `data-xray="o que é · como"` e `data-xray-tool="<motor>|code"` (+ `data-xray-cost`).
  `prefers-reduced-motion` começa em Parado.
- **Contrato de teste:** `?jump=<y>` abre já rolado e assentado; `window.__ready = true` só quando
  pronto de verdade; `?motion=on|off|xray` para fotos.

Receitas (motor de rolagem, textos sobre o filme, cabeçalho que se adapta, emenda filme → conteúdo,
acabamento, celular): `referencias/3-pagina.md`.

**Nunca rode servidor de prévia em primeiro plano.** Suba em background numa porta conferida com
`ss -ltn` (aborte se ocupada) e mate só o PID que você subiu.

---

## PASSO 6: os críticos (construtor, depois três críticos, até os três passarem)

- Divida o site em 3 ou 4 peças (topo e filme; seções; ação e rodapé; celular).
- Por peça: um subagente construtor, depois **três críticos com contexto limpo que nunca leem o
  código**: **briefing** (faz o que o `BRIEF.md` pede?), **sistema** (obedece o `sistema.md`?),
  **ofício** (o nosso ao lado da referência, sem rótulos e em ordem embaralhada: qual é melhor, e qual
  a maior diferença?). Veredito binário, sem nota.
- Os críticos veem pixels: `bash $S/scripts/pacote-criticos.sh <peça> "http://127.0.0.1:<porta>/site/"`.
- Qualquer REPROVA volta ao construtor com a maior diferença. Sem número fixo de rodadas.
  `progresso.md` sempre atualizado.
- **As notas da pessoa valem mais que qualquer crítico.** Grave no `BRIEF.md` na hora.

Detalhes: `referencias/5-criticos.md`.

---

## PASSO 7: texto, depois verificação

**Texto.** Curto, específico, humano, sem travessão, sem jargão, sem prova inventada.
`node $S/scripts/portao-texto.js site/index.html` precisa sair 0. Corrija o texto, nunca o portão.
Regras: `referencias/6-texto.md`.

**Verificação** (scripts, depois os seus olhos):
```bash
for m in on off xray; do
  node $S/scripts/fotos.js "http://127.0.0.1:<porta>/site/?motion=$m" fotos/desk-$m 1440x900 topo=0 filme=#filme:0.5 acao=#acao:0
  node $S/scripts/fotos.js "http://127.0.0.1:<porta>/site/?motion=$m" fotos/cel-$m 390x844 topo=0 filme=#filme:0.5 acao=#acao:0
done
node $S/scripts/verificar.js jank "http://127.0.0.1:<porta>/site/"     # quadro máx < 50 ms
python3 $S/scripts/cortes.py site/assets/*.mp4 loops/*.mp4             # todo vídeo publicado, saída 0
```
Olhe cada foto. Zero erro no console. **Julgue a transformação:** o começo e o fim do filme precisam
ser o início e o fim da mesma viagem; se dois capítulos pudessem trocar de lugar sem ninguém notar,
é uma pilha de cenas, não um plano.

**Relatório:** o que foi feito (uma linha por seção e seu movimento), a URL, os portões e
resultados, créditos gastos (soma do `ledger.tsv`) contra o orçamento, e o que ficou em aberto.

---

## Sem motor de vídeo (código puro)

Passos 1, 2, 5, 6 e 7 rodam iguais. O filme vira cenas de rolagem em código (cenas fixadas, revelação
por clip-path, corrida horizontal, parallax) e os objetos 3D viram SVG/canvas. Diga claramente que é
a alternativa, não o visual completo. Vocabulário: `referencias/3-pagina.md`, seção "Filme em código".

## Proteções
- Zero dado pessoal no que é publicado: nenhuma chave, e-mail de conta ou caminho de casa na página.
- Orçamento confirmado antes de gastar; ledger somado depois. Nunca encadear clipes em paralelo.
- Sem pulos: último quadro = primeiro na emenda, nenhum corte dentro do clipe, nenhum fade sobre emenda.
- Toda seção se mexe com propósito; a chave está sempre lá; movimento reduzido começa em Parado.
- Logo de marca real é baixado, nunca desenhado à mão.
- Fontes do Google Fonts; bibliotecas só de cdnjs ou jsdelivr.

## Armadilhas operacionais
- **Job pago não cancela.** Os motores gravam a resposta crua (com o id) ANTES de qualquer parse.
- **CLIs de geração comem a entrada padrão** dentro de `while read`: termine o comando com `< /dev/null`.
- **Dois escritores no mesmo arquivo, nunca.** Pare um agente antes de outro editar a mesma página.
- **Depois de compactar, arrume a lista de tarefas**, não só o chat.
- **Chave de API nunca em argumento de comando** (aparece no `ps` de qualquer usuário): passe pelo ambiente.
- **Filme preto enquanto baixa:** o motor de rolagem baixa 1 quadro a cada 8 primeiro e o canvas só
  aparece depois do 1º desenho; ponha o 1º quadro como pôster no fundo do palco (`background`).

## Arquivos
- `referencias/1-referencias.md` (passo 1), `2-motores.md` (3 e 4), `3-pagina.md` (5),
  `4-camada-movimento.md` (5), `5-criticos.md` (6), `6-texto.md` (7), `7-delegacao.md` (quem faz o quê).
- `motores/`: `kling.sh`, `agnes.sh`, `kie.sh`, `custom.sh`, `imagem_local.py`, `_comum.sh`, `README.md`.
- `scripts/`: `kf_aproxima.py`, `folha_kf.py`, `vetor.py`, `filme.sh`, `loop.sh`, `fixacao.py`, `cortes.py`,
  `montar.py`, `suavizar.py`, `continuidade.py`, `loopfix.py`, `capturar.js`, `pacote-criticos.sh`,
  `fotos.js`, `verificar.js`, `portao-texto.js`, `_browser.js`, `package.json`.
- `tests/motores-contrato.sh`: confere os 4 motores sem chamar serviço nenhum.
- `runtime/`: `motor-rolagem.js`, `chave-movimento.js`.
