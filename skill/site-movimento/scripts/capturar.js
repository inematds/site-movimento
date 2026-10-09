#!/usr/bin/env node
// capturar.js <url> <pasta> [l]x[a] — captura de um site de referência (passo 1):
//   anim_XX.jpg : 10 quadros do primeiro ecrã em 4 s (para ver o movimento do topo)
//   s_XXX.jpg   : a página inteira em passos de 0,7 tela, com rolagem de verdade
//   page.txt    : texto visível, fontes, cores, inventário de canvas/vídeo/WebGL
// Use em todo link de referência, para que a leitura seja feita dos pixels e não da memória.
const path = require('path'), fs = require('fs');
const { puppeteer, chromePath } = require('./_browser.js');
const [, , url, out, size = '1440x900'] = process.argv;
if (!url || !out) { console.error('uso: node capturar.js <url> <pasta> [1440x900]'); process.exit(1); }
const [W, H] = size.split('x').map(Number);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await puppeteer.launch({ executablePath: chromePath(), headless: 'new', args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36');
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 }).catch(e => console.log('goto', e.message));
  await new Promise(r => setTimeout(r, 2500));
  // fecha aviso de cookies óbvio (recusar / só necessários)
  await p.evaluate(() => { const t = [...document.querySelectorAll('button,a')].find(e => /reject|decline|necessary only|only necessary/i.test(e.textContent || '')); if (t) t.click(); }).catch(() => {});
  // esconde avisos que tapam a página, só para a captura (nada é clicado nem aceito)
  await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'absolute') && /regulatory notice|cookie/i.test(el.textContent || '') && el.getBoundingClientRect().width < innerWidth * 0.9 && el.textContent.length < 3000) { let n = el; while (n.parentElement && n.parentElement !== document.body && getComputedStyle(n.parentElement).position === 'fixed') n = n.parentElement; n.style.display = 'none'; } } document.documentElement.style.overflow = 'auto'; document.body.style.overflow = 'auto'; document.body.style.position = 'static'; }).catch(() => {});
  for (let i = 0; i < 10; i++) { await p.screenshot({ path: path.join(out, `anim_${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 }); await new Promise(r => setTimeout(r, 400)); }
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  let y = 0, k = 0;
  while (y < total && k < 60) {
    await p.mouse.move(W / 2, H / 2);
    for (let s = 0; s < 6; s++) { await p.mouse.wheel({ deltaY: H * 0.7 / 6 }); await new Promise(r => setTimeout(r, 90)); }
    await new Promise(r => setTimeout(r, 1300));
    y = await p.evaluate(() => scrollY + innerHeight);
    await p.screenshot({ path: path.join(out, `s_${String(k).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 66 });
    k++;
    const nt = await p.evaluate(() => document.documentElement.scrollHeight);
    if (y >= nt - 2) break;
  }
  const info = await p.evaluate(() => {
    const fonts = new Set(), colors = {};
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,span')) { const cs = getComputedStyle(el); fonts.add(cs.fontFamily.split(',')[0] + ' ' + cs.fontWeight); colors[cs.color] = (colors[cs.color] || 0) + 1; colors['bg ' + cs.backgroundColor] = (colors['bg ' + cs.backgroundColor] || 0) + 1; }
    const hs = [...document.querySelectorAll('h1,h2,h3')].slice(0, 40).map(h => `${h.tagName} ${Math.round(parseFloat(getComputedStyle(h).fontSize))}px ${getComputedStyle(h).fontFamily.split(',')[0]} | ${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 90)}`);
    return {
      title: document.title, height: document.documentElement.scrollHeight,
      canvases: [...document.querySelectorAll('canvas')].map(c => `${c.width}x${c.height} ${c.getContext ? (c.dataset.engine || '') : ''}`),
      videos: [...document.querySelectorAll('video')].map(v => v.currentSrc || v.src || (v.querySelector('source') || {}).src),
      lottie: !!document.querySelector('lottie-player,dotlottie-player,[data-lottie]'),
      scripts: [...document.scripts].map(s => s.src).filter(s => /three|gsap|lenis|spline|rive|lottie|framer|webflow|unicorn|curtains|ogl/i.test(s)),
      fonts: [...fonts].slice(0, 20), headings: hs,
      colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 16),
      text: document.body.innerText.slice(0, 6000)
    };
  });
  fs.writeFileSync(path.join(out, 'page.json'), JSON.stringify(info, null, 1));
  console.log(url, '->', k, 'scroll shots; height', info.height, '; canvases', info.canvases.length, '; videos', info.videos.length, '; libs', info.scripts.length);
  await b.close();
})();
