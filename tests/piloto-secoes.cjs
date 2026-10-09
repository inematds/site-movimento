// Fotografa cada seção do piloto (com ?motion=on) e lista erros de JS/console.
// Uso: node tests/piloto-secoes.cjs "<url-do-piloto>?motion=on" <pasta-saida> 1440 900   → "erros: nenhum"
const pw = require(require('os').homedir() + '/projetos/agent-browser/node_modules/playwright');
const [url, out, W, H] = process.argv.slice(2);
(async () => {
  const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
  const erros = []; p.on('pageerror', e => erros.push(e.message)); p.on('console', m => m.type() === 'error' && erros.push(m.text()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  for (const s of ['.news', '.vitrine', '.agenda', '.gravados', '.ecossistema', '.pro', '.rodape']) {
    await p.evaluate(sel => { const el = document.querySelector(sel); scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.25); }, s);
    await p.waitForTimeout(400); await p.mouse.wheel(0, 1); await p.waitForTimeout(2800);
    if (s === '.vitrine') { const c = await p.$('.vitrine .card:nth-child(5)'); await c.hover(); await p.waitForTimeout(600); }
    await p.screenshot({ path: `${out}/${s.slice(1)}.jpg`, quality: 70, type: 'jpeg' });
  }
  console.log('erros:', erros.length ? erros : 'nenhum'); await b.close();
})();
