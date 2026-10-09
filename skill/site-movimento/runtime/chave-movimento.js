/* Chave de movimento: Parado / Ligado / Raio-X. Vai em todo site feito com a skill site-movimento.

   API:  window.Movimento.modo          'off' | 'on' | 'xray'
         window.Movimento.mexendo       true quando não está parado
         window.Movimento.definir(modo)
         window.Movimento.ao(fn)        fn(modo) a cada troca (e uma vez já)
   Compatível também com window.Motion (mesma API em inglês: mode, moving, set, on), que o
   motor-rolagem.js consulta.

   Marque tudo que se move:
     data-xray="o que é · como se move"
     data-xray-tool="kling|agnes|kie|<outro motor>|code"   (vídeo gerado por IA ou desenhado em código)
     data-xray-cost="30"                                     (créditos gastos, opcional)
     data-xray-prompt="..."                                  (o prompt usado, opcional; abre ao clicar na etiqueta)
   URL: ?motion=off|on|xray (para fotos e testes). Tecla M alterna. prefers-reduced-motion começa em Parado. */
(function () {
  const MODOS = ['off', 'on', 'xray'];
  const ROTULO = { off: 'Parado', on: 'Ligado', xray: 'Raio-X' };
  const COR_CODIGO = '#7cc4ff', COR_IA = '#E2A23B';
  const ouvintes = [];
  let modo = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on';
  try { const q = new URLSearchParams(location.search).get('motion'); if (MODOS.includes(q)) modo = q; } catch (e) {}

  const css = `
  .mv-chave{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:3px;padding:4px;border-radius:999px;
    background:rgba(11,11,13,.78);color:#f3efe7;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:0 10px 36px rgba(0,0,0,.35),inset 0 0 0 1px rgba(243,239,231,.12);font:600 12px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.04em;user-select:none}
  .mv-chave .mv-k{padding:0 8px 0 10px;opacity:.6;display:flex;align-items:center;gap:7px;text-transform:uppercase;font-size:10.5px}
  .mv-chave .mv-k i{width:7px;height:7px;border-radius:50%;background:${COR_IA};box-shadow:0 0 10px ${COR_IA};transition:opacity .3s}
  html[data-motion=off] .mv-chave .mv-k i{opacity:.2;box-shadow:none}
  .mv-chave button{all:unset;cursor:pointer;padding:8px 12px;border-radius:999px;opacity:.72;transition:opacity .2s,background .25s,color .25s}
  .mv-chave button:hover{opacity:1}
  .mv-chave button[aria-pressed=true]{opacity:1;background:${COR_IA};color:#0b0b0d}
  .mv-chave button:focus-visible{outline:2px solid ${COR_IA};outline-offset:2px}
  html[data-motion=off] *,html[data-motion=off] *::before,html[data-motion=off] *::after{animation-play-state:paused!important;transition-duration:0s!important}
  html[data-motion=off] .mv-chave,html[data-motion=off] .mv-chave *{transition-duration:.2s!important}
  .mv-camada{position:fixed;inset:0;pointer-events:none;z-index:2147482990}
  .mv-caixa{position:absolute;border:1.5px dashed var(--c);border-radius:10px;box-shadow:inset 0 0 36px color-mix(in srgb,var(--c) 14%,transparent)}
  .mv-etq{position:absolute;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:7px;max-width:min(440px,80vw);padding:6px 10px 6px 6px;border-radius:9px;
    background:#0b0b0d;color:#f3efe7;font:600 11.5px/1.25 Inter,system-ui,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.4),inset 0 0 0 1px var(--c);white-space:nowrap}
  .mv-etq .mv-ic{width:20px;height:20px;border-radius:5px;flex:none;display:grid;place-items:center;font:700 9.5px/1 'JetBrains Mono',monospace;background:var(--c);color:#0b0b0d}
  .mv-etq .mv-t{overflow:hidden;text-overflow:ellipsis}
  .mv-etq .mv-custo{opacity:.6;font-weight:500}
  .mv-etq.aberta{white-space:normal;flex-wrap:wrap}
  .mv-etq .mv-p{display:none;width:100%;margin-top:6px;padding-top:7px;border-top:1px solid rgba(243,239,231,.14);font:500 11px/1.45 'JetBrains Mono',monospace;color:#cfc7ba}
  .mv-etq.aberta .mv-p{display:block}
  .mv-resumo{position:fixed;left:16px;bottom:16px;z-index:2147483000;padding:12px 14px;border-radius:14px;background:#0b0b0d;color:#f3efe7;
    font:600 12px/1.6 Inter,system-ui,sans-serif;box-shadow:0 10px 36px rgba(0,0,0,.4),inset 0 0 0 1px rgba(243,239,231,.14);display:none;min-width:210px}
  html[data-motion=xray] .mv-resumo{display:block}
  .mv-resumo .mv-l{display:flex;align-items:center;gap:8px}
  .mv-resumo .mv-ic{width:18px;height:18px;border-radius:4px;display:grid;place-items:center;font:700 8.5px/1 'JetBrains Mono',monospace;color:#0b0b0d}
  .mv-resumo .mv-dim{opacity:.6;font-weight:500}
  .mv-chave.recolhida .mv-k,.mv-chave.recolhida button:not([aria-pressed=true]){display:none}
  .mv-chave.recolhida{opacity:.55}
  .mv-chave.recolhida:hover,.mv-chave.recolhida:focus-within{opacity:1}
  .mv-chave.recolhida:hover .mv-k,.mv-chave.recolhida:hover button,.mv-chave.recolhida:focus-within .mv-k,.mv-chave.recolhida:focus-within button{display:flex}
  @media (max-width:640px){.mv-chave{right:10px;bottom:10px}.mv-chave .mv-k{display:none}.mv-resumo{left:10px;bottom:60px}}
  @media print{.mv-chave,.mv-camada,.mv-resumo{display:none}}`;

  let chave, camada, resumo, raf = 0;
  const ehCodigo = n => (n.dataset.xrayTool || 'code') === 'code';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function montar() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    chave = document.createElement('div'); chave.className = 'mv-chave';
    chave.setAttribute('role', 'group'); chave.setAttribute('aria-label', 'Movimento da página');
    chave.innerHTML = `<span class="mv-k"><i></i>Movimento</span>` +
      MODOS.map(m => `<button type="button" data-m="${m}">${ROTULO[m]}</button>`).join('');
    chave.addEventListener('click', e => { const b = e.target.closest('button'); if (b) definir(b.dataset.m); });
    camada = document.createElement('div'); camada.className = 'mv-camada'; camada.setAttribute('aria-hidden', 'true');
    resumo = document.createElement('div'); resumo.className = 'mv-resumo';
    document.body.append(camada, resumo, chave);
    camada.addEventListener('click', e => { const c = e.target.closest('.mv-etq'); if (c) c.classList.toggle('aberta'); });
    addEventListener('keydown', e => {
      if (e.key !== 'm' && e.key !== 'M') return;
      if (/input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable) return;
      definir(MODOS[(MODOS.indexOf(modo) + 1) % 3]);
    });
    aplicar();
  }

  function fazerResumo() {
    const todos = [...document.querySelectorAll('[data-xray]')];
    const ia = todos.filter(n => !ehCodigo(n));
    const creditos = ia.reduce((a, n) => a + (+n.dataset.xrayCost || 0), 0);
    const motores = [...new Set(ia.map(n => n.dataset.xrayTool))].join(', ');
    resumo.innerHTML =
      `<div class="mv-l"><span class="mv-ic" style="background:${COR_IA}">IA</span><span><b>${ia.length}</b> vídeos gerados <span class="mv-dim">· ${motores || 'nenhum'} · ${creditos} créditos</span></span></div>` +
      `<div class="mv-l" style="margin-top:6px"><span class="mv-ic" style="background:${COR_CODIGO}">&lt;/&gt;</span><span><b>${todos.length - ia.length}</b> em código <span class="mv-dim">· 0 créditos</span></span></div>`;
  }

  function desenhar() {
    raf = 0;
    if (!camada) return;
    if (modo !== 'xray') { camada.innerHTML = ''; return; }
    fazerResumo();   // elementos criados depois da montagem (scripts defer) também entram na conta
    const vh = innerHeight, vw = innerWidth, ocupados = [];
    let html = '';
    for (const n of document.querySelectorAll('[data-xray]')) {
      const r = n.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh || r.width < 8 || r.height < 8 || getComputedStyle(n).visibility === 'hidden') continue;
      const codigo = ehCodigo(n), c = codigo ? COR_CODIGO : COR_IA;
      const ic = codigo ? '&lt;/&gt;' : 'IA', nome = codigo ? 'Código' : esc(n.dataset.xrayTool);
      const x = Math.max(6, r.left), y = Math.max(6, r.top), w = Math.min(vw - 6, r.right) - x, h = Math.min(vh - 6, r.bottom) - y;
      let ey = y + 8; while (ocupados.some(v => Math.abs(v[0] - (x + 8)) < 160 && Math.abs(v[1] - ey) < 34)) ey += 34;
      ocupados.push([x + 8, ey]);
      const custo = n.dataset.xrayCost ? `<span class="mv-custo">· ${esc(n.dataset.xrayCost)} cr</span>` : '';
      const p = n.dataset.xrayPrompt ? `<span class="mv-p">${esc(n.dataset.xrayPrompt)}</span>` : '';
      html += `<div class="mv-caixa" style="--c:${c};left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>` +
        `<div class="mv-etq" style="--c:${c};left:${x + 8}px;top:${ey}px"><span class="mv-ic">${ic}</span><span class="mv-t">${nome} · ${esc(n.dataset.xray)}</span>${custo}${p}</div>`;
    }
    camada.innerHTML = html;
  }
  const agendar = () => { if (!raf && modo === 'xray') raf = requestAnimationFrame(desenhar); };

  function aplicar() {
    document.documentElement.dataset.motion = modo;
    if (chave) chave.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === modo)));
    if (camada) { fazerResumo(); desenhar(); }
    ouvintes.forEach(f => { try { f(modo); } catch (e) { console.error(e); } });
  }
  function definir(m) { if (!MODOS.includes(m) || m === modo) return; modo = m; aplicar(); }

  // Depois da primeira tela e meia, a chave se recolhe (só o modo ativo, meio transparente) para não
  // cobrir conteúdo; abre de novo com o mouse ou o foco do teclado. Em Raio-X fica sempre aberta.
  const recolher = () => { if (chave) chave.classList.toggle('recolhida', modo !== 'xray' && scrollY > innerHeight * 1.5); };
  addEventListener('scroll', recolher, { passive: true });
  ouvintes.push(recolher);
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar);
  setInterval(() => { if (modo === 'xray') agendar(); }, 500);

  const api = {
    get modo() { return modo; }, get mexendo() { return modo !== 'off'; }, definir,
    ao(f) { ouvintes.push(f); try { f(modo); } catch (e) { console.error(e); } },
    get mode() { return modo; }, get moving() { return modo !== 'off'; }, set: definir, on(f) { api.ao(f); }
  };
  window.Movimento = window.Motion = api;
  document.documentElement.dataset.motion = modo;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
