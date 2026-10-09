# Passo 5: a página

## Conteúdo
Motor de rolagem · Textos sobre o filme · Cabeçalho que se adapta · Emenda filme → conteúdo ·
Camada de abertura · Contrato de teste · Acabamento · Filme em código (sem motor de vídeo)

## Motor de rolagem (canvas + quadros, nunca `<video>`)

`vendor/motor-rolagem.js` já faz tudo abaixo; este texto explica por quê, para você ajustar sem trocar
por um `<video>` (vídeo não anda quadro a quadro com a rolagem: cada busca tem latência e trava).

```html
<section id="filme" style="height:850vh">            <!-- ~170vh por clipe -->
  <div class="palco" style="position:sticky;top:0;height:100vh">
    <canvas id="tela" style="width:100%;height:100%;display:block"></canvas>
    <!-- textos sobre o filme (batidas) -->
  </div>
</section>
<script src="vendor/chave-movimento.js"></script>
<script src="vendor/motor-rolagem.js"></script>
<script>
fetch('frames/manifest.json').then(r => r.json()).then(m => {
  const filme = MotionEngine.Scrub({
    canvas: document.getElementById('tela'), driver: document.getElementById('filme'),
    count: m.count, fps: 24, src: i => `frames/f_${String(i + 1).padStart(4, '0')}.jpg`,
    onProgress: p => atualizarBatidas(p)
  });
  MotionEngine.ready(() => filme.settle());
});
</script>
```

- **Cabeça de leitura suavizada** (`lerp` 0,14): ligar direto na rolagem parece mecânico.
- **Janela de ImageBitmap** (~2 s à frente, ~1,3 s atrás): decodifica fora da thread principal;
  cada desenho vira só uma cópia na GPU. Sem isso, o JPEG decodifica na hora e trava.
- **Carregamento em fila** (~10 por vez), começando pelo início, com o quadro mais próximo como
  reserva: nunca fica tela preta.
- **Cobrir ou pôr tarja:** cobre enquanto o corte for ≤ 22%; acima disso (celular em pé), mostra o
  quadro inteiro com tarja. Um 16:9 coberto num celular perde 74% da composição.
- **Nitidez vem da fonte 1:1**, não de mais pixels de tela: extraia ~1280–1440 px e limite o DPR a 1.

## Textos sobre o filme (batidas)

```html
<div class="batida" data-in="0.16" data-peak="0.235" data-out="0.31"><h2>…</h2></div>
```
Opacidade sobe de `in` até `peak` e desce até `out` (`data-out="2"` = não some, para o final).
A primeira batida aparece já no topo: `data-in="-0.1" data-peak="0"`.

**O roteiro do filme é instrução de produção, não texto.** Quem não vê o filme tem que ler cada
frase como uma promessa do assunto. Nunca diga onde a câmera está, para onde vai ou o que passa por
ela. As batidas dizem o que a imagem não diz: a promessa, a recusa, a graça. `portao-texto.js` reprova.

## Cabeçalho que se adapta

A cada ~180 ms, amostre a faixa de cima do quadro desenhado num canvas 16×4, tire a luminância
média e alterne `.sobre-claro` (limite ≈ 138). Todas as cores do cabeçalho via `currentColor`.
Um marcador de capítulo (rótulo + barra fina) serve de narrativa e de progresso.

## Emenda filme → conteúdo (sem linha)

`montar.py` grava em `frames/manifest.json` a cor da faixa de baixo do último quadro (`seam`).
Comece o fundo da seção seguinte exatamente nessa cor e acrescente um degradê no palco nos últimos
~8% do progresso (`(p - 0.92) / 0.08`). Filme escuro e conteúdo claro: uma "zona de pouso" alta que
derrete do escuro para a cor da marca no primeiro bloco.

## Camada de abertura (opcional, grátis)

Partículas temáticas em canvas sobre o primeiro quadro (poeira dourada, faíscas), sumindo nos
primeiros ~7% da rolagem. Um sprite de 32 px, `drawImage` por partícula, nunca `shadowBlur`.
Para de desenhar quando a opacidade chega a 0. Desligada em movimento reduzido.

## Contrato de teste (todo site)

```js
const PULO = new URLSearchParams(location.search).get('jump');
if (PULO !== null) history.scrollRestoration = 'manual';
// quando tudo carregou e assentou:
if (PULO !== null) { scrollTo(0, +PULO || 0); /* recalcula progresso, desenha, um tick */ }
window.__ready = true;
```
Esconda qualquer seguidor de cursor até o primeiro `mousemove` real (senão aparece em (0,0) nas fotos).
Julgue travadas por p95 e máximo do tempo de quadro, nunca pela média de fps.

## Acabamento (o que faz parecer caro)

1. **Corte a cabeça do filme.** Quase todo clipe abre num quadro que ainda não começou a andar.
2. **Texto sobre vídeo:** branco, não creme (creme parece sujo sobre imagem clara); sombra suave.
3. **Abaixo do filme é onde o site fica chato:** cada seção com altura mínima `min(92vh, 900px)`,
   um elemento muito maior que o resto, entrada com subida e fade em escada (~90 ms entre filhos).
4. **O botão principal é o elemento mais confiante da página**, não um link de texto.
5. **Logo real é baixado** (SVG oficial), nunca desenhado.
6. **Celular é outro filme**, não um filme mais estreito (ver `2-motores.md` §8).
7. **Foto preta não prova nada:** captura de aba escondida sai preta. Amostre o canvas
   (`getImageData` no centro em três momentos) antes de concluir que o filme não aparece.

## Filme em código (sem motor de vídeo)

O "filme" vira cenas conduzidas pela rolagem (GSAP + Lenis, via jsdelivr/cdnjs):
- revelação de título letra a letra (`yPercent: 120 → 0`, `power4.out`);
- cenas fixadas com `pin: true, scrub: true` (uma forma que cresce, uma máscara que abre);
- corrida horizontal fixada (trilho `width:max-content` andando `-(scrollWidth - innerWidth)`);
- revelação por `clip-path: inset(0 0 100% 0) → inset(0)`;
- faixa que inclina com a velocidade da rolagem; contadores que rodam uma vez.

**Ordem importa:** os ScrollTriggers são recalculados na ordem de criação. Crie as cenas fixadas
primeiro e os gatilhos de fundo depois, senão as posições saem erradas (efeitos disparam cedo).
Mesmo contrato de teste e mesma medida de travadas.
