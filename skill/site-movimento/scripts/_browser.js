// Navegador compartilhado por fotos.js, foto.js, capturar.js e verificar.js.
// Usa o Playwright (Chromium que ele mesmo instala) com uma camada fina que imita a parte da API
// do puppeteer que os scripts usam. Motivo: o Chromium do snap não conversa bem com puppeteer-core,
// e o Playwright já está instalado nos projetos da máquina.
//
// Onde procurar o Playwright, nesta ordem: $PLAYWRIGHT_DIR, ./node_modules (pasta scripts), ~/projetos/agent-browser.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function carregarPlaywright() {
  const lugares = [process.env.PLAYWRIGHT_DIR, __dirname, path.join(os.homedir(), 'projetos', 'agent-browser')].filter(Boolean);
  for (const l of lugares) {
    const p = path.join(l, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  console.error('Playwright não encontrado. Rode uma vez: cd "' + __dirname + '" && npm install && npx playwright install chromium');
  process.exit(2);
}
const pw = carregarPlaywright();

const ESPERA = { networkidle0: 'networkidle', networkidle2: 'networkidle', load: 'load', domcontentloaded: 'domcontentloaded' };

function envolverPagina(page) {
  return {
    _p: page,
    on: (ev, fn) => page.on(ev, fn),
    evaluate: (fn, ...args) => page.evaluate(fn, args.length > 1 ? args : args[0]),
    goto: (url, o = {}) => page.goto(url, { waitUntil: ESPERA[o.waitUntil] || 'load', timeout: o.timeout || 60000 }),
    setViewport: ({ width, height }) => page.setViewportSize({ width, height }),
    waitForFunction: (f, o = {}) => page.waitForFunction(f, null, { timeout: o.timeout || 30000 }),
    screenshot: (o = {}) => page.screenshot(o),
    setUserAgent: ua => page.setExtraHTTPHeaders({ 'User-Agent': ua }),
    mouse: {
      move: (x, y) => page.mouse.move(x, y),
      wheel: (o = {}) => page.mouse.wheel(o.deltaX || 0, o.deltaY || 0),
      click: (x, y) => page.mouse.click(x, y),
    },
    keyboard: page.keyboard,
  };
}

const puppeteer = {
  async launch(o = {}) {
    const browser = await pw.chromium.launch({ headless: true, args: o.args || [] });
    return {
      async newPage() {
        const ctx = await browser.newContext({ deviceScaleFactor: 1 });
        return envolverPagina(await ctx.newPage());
      },
      close: () => browser.close(),
    };
  },
};

// Compatibilidade: os scripts passam executablePath: chromePath(); o Playwright ignora.
const chromePath = () => undefined;
module.exports = { puppeteer, chromePath };
