/* Camada de movimento do piloto: filme de abertura + um gráfico em código por seção.
   Depende de vendor/chave-movimento.js e vendor/motor-rolagem.js (carregados antes). */
(function () {
  var reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parado = function () { return reduzido || (window.Movimento && !window.Movimento.mexendo); };
  var lim = function (v) { return Math.max(0, Math.min(1, v)); };
  // progresso de uma seção: 0 quando o topo dela entra por baixo, 1 quando o meio dela passa do meio da tela
  function progresso(el) {
    var r = el.getBoundingClientRect(), vh = innerHeight;
    return lim((vh - r.top) / (vh * 0.5 + r.height * 0.5));
  }
  var tarefas = [];
  var agendado = false;
  function rodar() {
    agendado = false;
    for (var i = 0; i < tarefas.length; i++) { try { tarefas[i](); } catch (e) { console.error(e); } }
  }
  function agendar() { if (!agendado) { agendado = true; requestAnimationFrame(rodar); } }
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar);

  /* ---------- filme de abertura ---------- */
  var secFilme = document.getElementById('filme');
  var batidas = [].slice.call(document.querySelectorAll('.batida'));
  var trilho = document.querySelector('.capitulo .trilho i');
  var rotulo = document.querySelector('.capitulo .rotulo');
  var fim = document.querySelector('.filme .fim');
  var carregando = document.querySelector('.carregando');
  var CAPS = (rotulo && rotulo.dataset.capitulos || '').split('|');
  function alfa(b, p) {
    var i = +b.dataset.in, pk = +b.dataset.peak, o = +b.dataset.out;
    if (p < i || p > o) return 0;
    if (p < pk) return (p - i) / Math.max(1e-4, pk - i);
    if (o > 1.5) return 1;
    return 1 - (p - pk) / Math.max(1e-4, o - pk);
  }
  function batidasEm(p) {
    batidas.forEach(function (b) {
      var a = alfa(b, p);
      b.style.opacity = a.toFixed(3);
      b.style.transform = 'translateY(' + ((1 - a) * 18).toFixed(1) + 'px)';
    });
    if (trilho) trilho.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (rotulo && CAPS.length) rotulo.textContent = CAPS[Math.min(CAPS.length - 1, Math.floor(p * CAPS.length))];
    if (fim) fim.style.opacity = (0.5 * lim((p - 0.8) / 0.2)).toFixed(3);  // escurece o painel filmado enquanto o real sobe
  }
  var filme = null;
  fetch('frames/manifest.json').then(function (r) { return r.json(); }).then(function (m) {
    filme = MotionEngine.Scrub({
      canvas: document.getElementById('tela'), driver: secFilme, count: m.count, fps: 24, dpr: 1,
      // composição centrada (perspectiva de um ponto): aguenta cobrir a tela do celular sem perder o assunto
      maxCrop: innerWidth < 720 ? 0.8 : 0.22,
      src: function (i) { return 'frames/f_' + String(i + 1).padStart(4, '0') + '.jpg'; },
      onProgress: function (p) { batidasEm(p); },
      onLoad: function (f) { if (carregando) carregando.textContent = f < 1 ? Math.round(f * 100) + '%' : ''; }
    });
    MotionEngine.ready(function () { filme.settle(); agendar(); });
  }).catch(function (e) { console.error('manifest', e); window.__ready = true; });
  batidasEm(0);

  /* ---------- áreas: moldura que desliza até o cartão ativo ---------- */
  var vitrine = document.querySelector('.vitrine');
  if (vitrine) {
    var moldura = document.createElement('span');
    moldura.className = 'moldura';
    moldura.setAttribute('aria-hidden', 'true');
    moldura.dataset.xray = 'moldura que desliza com mola até o cartão sob o mouse ou o foco';
    moldura.dataset.xrayTool = 'code';
    vitrine.appendChild(moldura);
    var ir = function (card) {
      var a = vitrine.getBoundingClientRect(), b = card.getBoundingClientRect();
      moldura.style.width = b.width + 'px'; moldura.style.height = b.height + 'px';
      moldura.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px)';
      moldura.style.opacity = '1';
    };
    vitrine.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('mouseenter', function () { ir(c); });
      c.addEventListener('focus', function () { ir(c); });
    });
    vitrine.addEventListener('mouseleave', function () { moldura.style.opacity = '0'; });
  }

  /* ---------- agenda: rota com avião que anda com a rolagem ---------- */
  var agenda = document.querySelector('.agenda');
  if (agenda) {
    var NS = 'http://www.w3.org/2000/svg';
    var paradas = agenda.querySelectorAll('.evento-principal, .evento').length || 5;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'rota'); svg.setAttribute('viewBox', '0 0 1000 70'); svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.dataset.xray = 'rota das turmas · o avião avança com a rolagem e acende cada parada';
    svg.dataset.xrayTool = 'code';
    var d = 'M 20 50 C 260 50 300 14 500 22 S 760 52 980 18';
    svg.innerHTML = '<path class="trajeto" d="' + d + '"/><path class="feito" d="' + d + '"/>';
    var feito = svg.querySelector('.feito');
    agenda.querySelector('.bloco-topo').after(svg);
    var L = feito.getTotalLength();
    feito.style.strokeDasharray = L; feito.style.strokeDashoffset = L;
    var pts = [];
    for (var k = 0; k < paradas; k++) {
      var pt = feito.getPointAtLength(L * (k + 0.5) / paradas);
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'parada'); c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', 7);
      svg.appendChild(c); pts.push([c, (k + 0.5) / paradas]);
    }
    var aviao = document.createElementNS(NS, 'path');
    aviao.setAttribute('class', 'aviao');
    aviao.setAttribute('d', 'M -14 0 L 10 -3 L 16 0 L 10 3 Z M -2 -1 L -8 -12 L -3 -12 L 6 -1 Z M -2 1 L -8 12 L -3 12 L 6 1 Z M -12 -1 L -16 -6 L -13 -6 L -9 -1 Z M -12 1 L -16 6 L -13 6 L -9 1 Z');
    svg.appendChild(aviao);
    tarefas.push(function () {
      var p = parado() ? 1 : progresso(agenda);
      feito.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      var a = feito.getPointAtLength(L * Math.max(0.001, p)), b = feito.getPointAtLength(Math.min(L, L * p + 2));
      var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      aviao.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      pts.forEach(function (q) { q[0].classList.toggle('on', p >= q[1]); });
    });
  }

  /* ---------- gravados: barra de gravação ---------- */
  var gravados = document.querySelector('.gravados');
  if (gravados) {
    var rec = document.createElement('div');
    rec.className = 'rec'; rec.setAttribute('aria-hidden', 'true');
    rec.dataset.xray = 'barra de gravação · enche com a rolagem, relógio conta junto';
    rec.dataset.xrayTool = 'code';
    rec.innerHTML = '<span class="ponto"></span><span>REC</span><span class="fita"><i></i></span><span class="tempo">00:00</span>';
    gravados.querySelector('.bloco-topo').after(rec);
    var fita = rec.querySelector('.fita i'), tempo = rec.querySelector('.tempo');
    var TOTAL = 90 * 60; // uma aula de 1 h 30 como referência visual do relógio
    tarefas.push(function () {
      var p = parado() ? 1 : progresso(gravados);
      fita.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var s = Math.round(TOTAL * p), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
      tempo.textContent = (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    });
  }

  /* ---------- ecossistema: a linha que liga as quatro portas ---------- */
  var portas = document.querySelector('.portas');
  if (portas) {
    var NS2 = 'http://www.w3.org/2000/svg';
    var lig = document.createElementNS(NS2, 'svg');
    lig.setAttribute('class', 'ligacao'); lig.setAttribute('aria-hidden', 'true');
    lig.dataset.xray = 'as quatro portas se ligam · a linha se desenha com a rolagem';
    lig.dataset.xrayTool = 'code';
    var caminho = document.createElementNS(NS2, 'path');
    lig.appendChild(caminho); portas.prepend(lig);
    var Lp = 0;
    var tracar = function () {
      var a = portas.getBoundingClientRect();
      var pts2 = [].map.call(portas.querySelectorAll('.porta'), function (li) {
        var b = li.getBoundingClientRect();
        return [b.left - a.left + 22, b.top - a.top + 22];
      });
      if (!pts2.length) return;
      caminho.setAttribute('d', 'M ' + pts2.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L '));
      Lp = caminho.getTotalLength();
      caminho.style.strokeDasharray = Lp;
    };
    tracar(); addEventListener('resize', tracar);
    tarefas.push(function () {
      var p = parado() ? 1 : lim(progresso(portas) * 1.15);
      caminho.style.strokeDashoffset = (Lp * (1 - p)).toFixed(1);
    });
  }

  /* ---------- pro: os arquivos entram na pasta ---------- */
  var pro = document.querySelector('.pro');
  if (pro) {
    var NS3 = 'http://www.w3.org/2000/svg';
    var pasta = document.createElementNS(NS3, 'svg');
    pasta.setAttribute('class', 'pasta'); pasta.setAttribute('viewBox', '0 0 180 130'); pasta.setAttribute('aria-hidden', 'true');
    pasta.dataset.xray = 'arquivos, códigos e aulas entram na pasta da comunidade · com a rolagem';
    pasta.dataset.xrayTool = 'code';
    var folha = function (i) {
      return '<g class="f" data-i="' + i + '"><rect class="folha" x="0" y="0" width="70" height="86" rx="6"/>' +
        '<line class="linha-f" x1="12" y1="20" x2="58" y2="20"/><line class="linha-f" x1="12" y1="34" x2="50" y2="34"/>' +
        '<line class="linha-f" x1="12" y1="48" x2="56" y2="48"/></g>';
    };
    pasta.innerHTML = '<path class="fundo" d="M10 36 h52 l12 -12 h96 v100 h-160 z"/>' + folha(0) + folha(1) + folha(2) +
      '<path class="frente" d="M10 60 h160 v64 h-160 z"/>';
    var bloco = pro.querySelector('.pro-grade > div');
    if (bloco) bloco.prepend(pasta);
    var fs = pasta.querySelectorAll('.f');
    tarefas.push(function () {
      var p = parado() ? 1 : progresso(pro);
      fs.forEach(function (g, i) {
        var q = lim((p - i * 0.18) / 0.5);               // cada folha entra um pouco depois da anterior
        var x = 20 + i * 38, yIni = -70 - i * 10, yFim = 34 + i * 2;
        var y = yIni + (yFim - yIni) * (1 - Math.pow(1 - q, 3));
        g.setAttribute('transform', 'translate(' + x + ' ' + y.toFixed(1) + ') rotate(' + ((1 - q) * (i - 1) * 14).toFixed(1) + ' 35 43)');
        g.style.opacity = q > 0 ? 1 : 0;
      });
    });
  }

  /* ---------- rodapé: um avião decola uma vez ---------- */
  var rodape = document.querySelector('.rodape');
  if (rodape) {
    var NS4 = 'http://www.w3.org/2000/svg';
    var dec = document.createElementNS(NS4, 'svg');
    dec.setAttribute('class', 'decola'); dec.setAttribute('viewBox', '0 0 1000 60'); dec.setAttribute('preserveAspectRatio', 'none');
    dec.setAttribute('aria-hidden', 'true');
    dec.dataset.xray = 'decolagem · o avião sai quando o rodapé aparece';
    dec.dataset.xrayTool = 'code';
    var dd = 'M -20 58 C 300 58 600 40 1020 2';
    dec.innerHTML = '<path class="rastro" d="' + dd + '"/><path class="aviao" d="M -14 0 L 10 -3 L 16 0 L 10 3 Z M -2 -1 L -8 -12 L -3 -12 L 6 -1 Z M -2 1 L -8 12 L -3 12 L 6 1 Z"/>';
    rodape.prepend(dec);
    var rastro = dec.querySelector('.rastro'), av = dec.querySelector('.aviao');
    var Lr = rastro.getTotalLength();
    rastro.style.strokeDasharray = Lr; rastro.style.strokeDashoffset = Lr;
    var t0 = 0, foi = false;
    var voar = function (agora) {
      if (!t0) t0 = agora;
      var q = parado() ? 1 : lim((agora - t0) / 2600);
      var e = q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
      rastro.style.strokeDashoffset = (Lr * (1 - e)).toFixed(1);
      var a = rastro.getPointAtLength(Lr * e), b = rastro.getPointAtLength(Math.min(Lr, Lr * e + 2));
      av.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI).toFixed(1) + ')');
      if (q < 1) requestAnimationFrame(voar);
    };
    var ini = rastro.getPointAtLength(0);
    av.setAttribute('transform', 'translate(' + ini.x + ' ' + ini.y + ')');
    if (parado()) { foi = true; voar(performance.now()); }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !foi) { foi = true; t0 = 0; requestAnimationFrame(voar); }
    }, { threshold: 0.3 }).observe(rodape);
  }

  if (window.Movimento) window.Movimento.ao(agendar);
  agendar();
})();
