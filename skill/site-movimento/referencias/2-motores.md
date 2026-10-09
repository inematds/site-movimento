# Passos 3 e 4: keyframes e vídeo

## Conteúdo
0. Números medidos · 1. A lei do filme · 2. Keyframes (aproximação encadeada, folha_kf, filtro) ·
3. Motores (kling, agnes, kie, custom, escolher) · 4. Prompt de clipe · 5. Cortes e SSIM ·
6. Montagem · 7. Loops · 8. Celular

## 0. Números medidos (piloto, 08/10/2026)

| O quê | Medida |
|---|---|
| Keyframe local (flux2-klein, 1280×720) | 1ª imagem ~180 s (carrega o modelo); depois ~11–17 s; custo zero |
| Kling `kling-video-v3_0`, 5 s, 720p, sem áudio, com quadro final | **30 créditos**, 4–15 min com fila |
| Kling respeita os quadros fixados? | **Sim**: início 0,994 e fim 0,911 em `fixacao.py` (troca invertida dá 0,22) |
| SSIM do ffmpeg em resolução cheia no mesmo quadro | ~0,6 (ruído redesenhado) → não use para "fixou?" |
| Edição de imagem com "a câmera andou para frente" | devolve a referência quase igual (`folha_kf.py` marca PARADO) |

## 1. A lei do filme

1. **Primeiro quadro = último quadro.** O clipe N>1 começa no último quadro REAL do clipe anterior
   (pixels extraídos com ffmpeg, nunca o keyframe) e termina no keyframe seguinte. Os dois lados fixados.
2. **Passos pequenos, uma mudança por passo:** mais perto, OU outro lugar, OU outra luz. Nunca dois.
   Oito passos pequenos valem mais que quatro grandes no mesmo tempo.
3. **O eixo da câmera não muda.** Vista frontal continua frontal; de cima continua de cima.
4. **Um sentido só** (o vetor). `vetor.py` confere antes de gastar.
5. **Áudio desligado** nos clipes do site (o vídeo toca mudo).
6. **Em ordem, nunca em paralelo.** Cada clipe depende do último quadro do anterior.

## 2. Keyframes

### Aproximação encadeada (padrão, sem custo)
`scripts/kf_aproxima.py anterior.png proximo.png "<cena nessa distância + sufixo>" --fator 1.8 --centro x,y`

- Recorta o centro (`1/fator` da imagem) em volta do ponto de mira, amplia para o tamanho cheio e
  pede ao modelo só para redesenhar detalhes. O eixo da câmera fica garantido pela geometria.
- `--fator` 1,5 a 2,0 é o passo seguro para um clipe de 5 s. Acima disso, ponha um keyframe no meio.
- `--centro` acompanha o alvo da viagem (no piloto, o painel de partidas em 0,5 × 0,48).
- O prompt descreve a cena **naquela distância** ("de pé diante da porta de vidro, o saguão âmbar
  atrás") e termina com "mantenha exatamente a mesma composição, enquadramento, cores e luz".
- Filme que **recua**: gere do keyframe mais fechado para o mais aberto (o recorte vai ao contrário)
  e inverta a ordem no roteiro.
- Atravessar uma porta/parede é o passo mais arriscado: o modelo pode trocar o que está do outro lado.
  `folha_kf.py` mostra isso como OLHE (nota baixa); confira o clipe com `cortes.py`.

### `folha_kf.py` (sempre, antes de gastar)
Compara cada par procurando a escala e o centro que melhor explicam o passo. Leitura:
- `ok` (≥ 0,30): passo limpo;
- `OLHE` (0,12–0,30): mudou bastante; olhe a folha;
- `QUEBRA?` (< 0,12): eixo, lugar ou luz mudaram; refaça ou ponha um keyframe no meio;
- `PARADO`: o keyframe não andou (o modelo devolveu a referência).

### Filtro de segurança
Prompt inofensivo recusado? Procure formas cilíndricas em pé (pilar, tubo, haste, poste) e troque
por tambor baixo, disco, pedestal redondo ou bloco arredondado. Não pague para repetir as mesmas palavras.

## 3. Motores de vídeo

Contrato único (`motores/README.md`): `motores/<motor>.sh <inicio.png> <fim.png|-> "<prompt>" <segundos> <saida.mp4>`
→ `<saida.mp4>`, `<saida.mp4>.json` (resposta crua com o id do job) e `<saida>.ultimo.png`.

### kling (assinatura)
- Modelo `kling-video-v3_0`: o único da conta com quadro final (`tail_image`) e duração 3–15 s.
- O servidor diz que quadro final "exige 1080p", mas o envio em 720p foi aceito e fixou os dois lados.
- **`prefer_multi_shots` vem ligado por padrão** e pode cortar dentro do clipe: o motor passa `false`.
- Áudio vem ligado por padrão: o motor passa `enable_audio false`.
- Arquivo local é enviado sozinho pelo CLI; o motor grava a saída crua antes de procurar a URL.
- `KLING_RESOLUCAO=1080p` para o filme final se o orçamento permitir (mais créditos por clipe).

### agnes (chave AGNES_API_KEY)
- Modo `keyframes`: interpola entre início e fim (exige os dois).
- Prompt em inglês; ~1/3 de 503 transitórios; ~1 vídeo por minuto; `num_frames` = 8n+1.

### kie (chave KIE_API_KEY da pessoa)
- Um hub com vários modelos. Defina `KIE_MODELO` e, se o modelo usar outros nomes de campo, `KIE_CAMPOS`.
- Imagens precisam de URL pública: o motor usa o upload do próprio serviço ou `KIE_SUBIR=<seu comando>`.
- **Teste a fixação no primeiro clipe** (`fixacao.py`) antes de encadear: há modelos que tratam
  início e fim como "referência" e redesenham o quadro, e aí a cadeia pula.

### custom (qualquer IA)
- `MOTOR_CMD='meu-cli --start {inicio} --end {fim} -p {prompt} --sec {segundos} -o {saida}'`.
- Serve para um modelo local (ex.: um modelo de vídeo com primeiro/último quadro rodando na sua GPU),
  outro serviço ou um script seu. A skill só exige que `{saida}` seja um MP4.

### Escolher motor para cadeia
Só serve para cadeia o motor que **fixa o quadro de início** (≥ 0,90 em `fixacao.py`). Motor que
redesenha o início serve para um filme único (sem emendas), não para o topo do site.

## 4. Prompt de clipe

Descreve a VIAGEM do quadro de início ao de fim, nunca o estado de um deles.
- Diga o sentido (avança, entra, desce, recua) e repita o eixo: "camera stays at eye level and perfectly centered".
- Nomeie algo visível no quadro final que não está no inicial (o destino).
- "one continuous shot, no turning, no cuts".
- N keyframes fazem N−1 clipes. Lista de clipes com N itens = erro de um.

## 5. Cortes escondidos e leitura de SSIM

- `cortes.py`: SSIM de cada par vizinho; par abaixo de (mediana − 0,25) é corte. Clipe com corte
  nunca é usado. Não compre clipe-ponte (pontes entre cortes cortam de novo) e não esconda com fade.
- Textura estocástica (chuva, água, partículas, ruído de asfalto molhado) derruba o SSIM sem ser
  corte. Antes de condenar, olhe o lado a lado.
- `continuidade.py` julga pela forma LOCAL da curva (queda brusca contra os vizinhos), não por um
  número fixo: travelling rápido e liso marca baixo e é bom.

## 6. Montagem

- Do clipe 2 em diante comece no quadro 1 (o 0 é o fixado, repetido).
- Corte a cabeça parada do primeiro clipe (olhe os 2 primeiros segundos quadro a quadro).
- Todos os quadros vão para o site (1280 px, q5). Para caber, reduza largura e qualidade, nunca a
  quantidade: menos quadros vira apresentação de slides.
- Tranco nas emendas (cada clipe desacelera ao chegar e acelera ao sair): `suavizar.py`.

## 7. Loops

Imagem de início = imagem de fim, movimento que volta ao começo. `fixacao.py` no fim ≥ 0,90; se a
costura aparecer, `loopfix.py`. No site: `<video muted playsinline loop autoplay>`.

## 8. Celular

Um filme 16:9 numa tela 390×844 mostra só o centro (~26%). O motor de rolagem cobre enquanto o
corte é pequeno e põe tarjas quando passa de 22%. Para um filme de verdade no celular, faça uma
segunda passada 9:16 com a mesma viagem (custa o dobro de clipes).
