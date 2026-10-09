#!/usr/bin/env node
// fotos.js <url> <pasta> <l>x<a> <foto> [<foto> ...]
//   foto = nome=<y>            scrollY absoluto
//        | nome=#id:<fração>   dentro do elemento #id: scrollY = topo + fração*(altura - innerHeight)
// Rola até lá em passos pequenos de verdade (para o filme e os observadores assentarem como numa
// visita), depois fotografa. Mostra erros do console, se window.__ready disparou e o jank
// (MotionEngine.jank(): p95 e máximo do tempo de quadro).
// Acrescente ?motion=on|off|xray na URL para fotografar cada modo da chave.
const path = require('path');
const { puppeteer, chromePath } = require('./_browser.js');
const [, , url, outdir, size, ...shots] = process.argv;
if (!url || !outdir || !size) { console.error('uso: node fotos.js <url> <pasta> <l>x<a> nome=<y>|nome=#id:<fração> ...'); process.exit(1); }
const [W, H] = size.split('x').map(Number);
(async () => {
  require('fs').mkdirSync(outdir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: 'new', args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errs.push('reqfail: ' + r.url()));
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 }).catch(() => errs.push('__ready never true'));
  await new Promise(r => setTimeout(r, 1500));
  for (const s of shots) {
    const [name, spec] = s.split('=');
    const y = await page.evaluate(sp => {
      if (sp.startsWith('#')) { const [sel, f] = sp.split(':'); const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const top = r.top + scrollY; return Math.round(top + (+f || 0) * Math.max(0, r.height - innerHeight)); }
      return +sp;
    }, spec);
    // scroll in steps so lerped scrubs + observers settle like a real visitor
    await page.evaluate(async ty => { const y0 = scrollY, n = 24; for (let i = 1; i <= n; i++) { scrollTo(0, y0 + (ty - y0) * i / n); await new Promise(r => requestAnimationFrame(r)); } }, y);
    await new Promise(r => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(outdir, name + '.jpg'), type: 'jpeg', quality: 70 });
    console.log('foto', name, 'y=' + y);
  }
  const jank = await page.evaluate(() => window.MotionEngine ? window.MotionEngine.jank() : null);
  console.log('jank', JSON.stringify(jank));
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'no console errors');
  await browser.close();
})();
