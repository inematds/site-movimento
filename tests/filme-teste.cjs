// Fotografa o filme no começo e no meio LOGO depois de carregar (sem esperar todos os quadros)
// e diz qual pasta de quadros a página usou (frames = horizontal, frames-v = celular em pé).
// Uso: node tests/filme-teste.cjs "<url-do-piloto>?motion=on" <prefixo-saida> 1440 900
//      → "1440x900 pastas: frames | vertical: false | erros: nenhum"
const pw = require(require('os').homedir() + '/projetos/agent-browser/node_modules/playwright');
const [url, out, W, H] = process.argv.slice(2);
(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +W, height: +H }, isMobile: +W < 720, hasTouch: +W < 720 });
  const p = await ctx.newPage(); const erros = [], pastas = new Set();
  p.on('pageerror', e => erros.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && erros.push(m.text()));
  p.on('response', r => { if (r.status() >= 400) erros.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
  p.on('request', r => { const m = r.url().match(/\/(frames(?:-v)?)\/f_/); if (m) pastas.add(m[1]); });
  await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
  await p.screenshot({ path: out + '-0.jpg', quality: 60, type: 'jpeg' });
  const alt = await p.evaluate(() => { const f = document.querySelector('.filme'); return f.offsetTop + f.offsetHeight * 0.55; });
  await p.evaluate(y => scrollTo(0, y), alt); await p.waitForTimeout(500);
  await p.screenshot({ path: out + '-meio.jpg', quality: 60, type: 'jpeg' });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: out + '-meio-3s.jpg', quality: 60, type: 'jpeg' });
  const vert = await p.evaluate(() => document.documentElement.classList.contains('filme-vertical'));
  console.log(W + 'x' + H, 'pastas:', [...pastas].join(','), '| vertical:', vert, '| erros:', erros.length ? erros : 'nenhum');
  await b.close();
})();
