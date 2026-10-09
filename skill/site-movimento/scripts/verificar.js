#!/usr/bin/env node
/*
 * Verificação visual (sem modelo).
 *
 *   node verificar.js shot <url> <saida.png> [largura] [altura]   # foto na posição de ?jump
 *   node verificar.js jank <url>                                   # rola a página toda e mede travadas
 *
 * Roda num navegador próprio, fora de painel de prévia (painel escondido congela o rAF e devolve
 * foto preta ou velha). A página testada precisa seguir o contrato de teste: ?jump=<y> abre já rolada
 * e assentada, e window.__ready === true quando estiver pronta. Se __ready nunca chegar, o teste
 * REPROVA: foto de página que não terminou de carregar não prova nada.
 */
const { puppeteer, chromePath } = require('./_browser.js');

async function withBrowser(fn) {
  const b = await puppeteer.launch({
    executablePath: chromePath(),
    headless: 'new',
    args: [
      '--hide-scrollbars',
      ...(process.env.CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
    ],
  });
  try { return await fn(b); }
  finally { await b.close().catch(() => {}); }
}

async function ready(page) {
  await page.waitForFunction('window.__ready === true', { timeout: 45000 })
    .catch(() => { throw new Error('window.__ready never fired — page not ready, refusing to capture (implement the dev contract)'); });
}

async function shot(url, out, w = 1440, h = 900) {
  await withBrowser(async b => {
    const page = await b.newPage();
    await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await ready(page);
    await new Promise(r => setTimeout(r, 1200)); // let lerps/entrances settle
    await page.screenshot({ path: out });
    console.log('capturado', out);
  });
}

async function jank(url) {
  await withBrowser(async b => {
    const page = await b.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await ready(page);
    const stats = await page.evaluate(() => new Promise(res => {
      const end = Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - innerHeight);
      const deltas = [], picos = []; let last = performance.now(), y = 0;
      const tick = () => {
        const now = performance.now(); deltas.push(now - last); if (now - last > 50) picos.push([Math.round(now - last), Math.round(scrollY)]); last = now;
        y += 13; window.scrollTo(0, Math.min(y, end));
        if (y < end) requestAnimationFrame(tick);
        else {
          deltas.sort((a, b) => a - b);
          const p = q => deltas[Math.floor(deltas.length * q)];
          res({
            frames: deltas.length, scrolled: end,
            avg: +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1),
            p95: +p(0.95).toFixed(1), max: +deltas[deltas.length - 1].toFixed(1),
            over50: deltas.filter(d => d > 50).length, picos: picos.slice(0, 5),
          });
        }
      };
      requestAnimationFrame(tick);
    }));
    console.log(JSON.stringify(stats));
    console.log(stats.max < 50 ? 'PASSA (máx < 50 ms)' : 'TRAVADA — veja picos [ms, scrollY]: janela de bitmaps, DPR, peso dos quadros ou algo pesado naquele ponto');
    if (stats.max >= 50) process.exitCode = 2;
  });
}

const [mode, url, out, w, h] = process.argv.slice(2);
(async () => {
  if (mode === 'shot') await shot(url, out, w, h);
  else if (mode === 'jank') await jank(url);
  else { console.error('uso: node verificar.js shot <url> <saida.png> [l] [a]  |  node verificar.js jank <url>'); process.exit(1); }
})().catch(e => { console.error(e.message); process.exit(1); });
