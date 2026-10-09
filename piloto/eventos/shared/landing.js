// Landing do INEMA Eventos. Nenhum texto visível mora aqui: tudo vem do HTML
// traduzido no build ou dos dados do INEMA News no idioma da página.
(function () {
  var lang = (document.documentElement.lang || 'pt').slice(0, 2);
  var locale = lang === 'pt' ? 'pt-BR' : lang;
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Relógio do painel.
  var relogio = document.querySelector('[data-relogio]');
  function hora() {
    if (relogio) relogio.textContent = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  hora();
  setInterval(hora, 15000);

  // Painel split-flap: cada letra vira uma plaqueta. O texto original segue legível para leitores de tela.
  var flaps = [];
  document.querySelectorAll('.flap').forEach(function (el) {
    var texto = el.textContent.trim();
    var leitura = document.createElement('span');
    leitura.className = 'sr';
    leitura.textContent = texto;
    var visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    var tiles = [];
    texto.split(/\s+/).forEach(function (palavra) {
      var grupo = document.createElement('span');
      grupo.className = 'pal';
      Array.from(palavra.toLocaleUpperCase(locale)).forEach(function (letra) {
        var t = document.createElement('span');
        t.className = 't';
        t.textContent = letra;
        t.dataset.final = letra;
        grupo.appendChild(t);
        tiles.push(t);
      });
      visual.appendChild(grupo);
    });
    el.textContent = '';
    el.appendChild(leitura);
    el.appendChild(visual);
    flaps.push({ el: el, tiles: tiles });
  });

  var rodando = false;
  function girar(lista) {
    if (calmo || !lista.length) return;
    var inicio = performance.now();
    var alvos = [];
    lista.forEach(function (f, linha) {
      f.tiles.forEach(function (t, i) {
        alvos.push({ t: t, fim: inicio + 380 + linha * 70 + i * 45 + Math.random() * 180, ultimo: 0 });
      });
    });
    rodando = true;
    function passo(agora) {
      var vivos = 0;
      alvos.forEach(function (a) {
        if (a.pronto) return;
        if (agora >= a.fim) {
          a.t.textContent = a.t.dataset.final;
          a.t.classList.remove('gira');
          a.pronto = true;
          return;
        }
        vivos++;
        if (agora - a.ultimo > 55) {
          a.ultimo = agora;
          a.t.textContent = LETRAS[(Math.random() * LETRAS.length) | 0];
          a.t.classList.remove('gira');
          void a.t.offsetWidth;
          a.t.classList.add('gira');
        }
      });
      if (vivos) requestAnimationFrame(passo); else rodando = false;
    }
    requestAnimationFrame(passo);
  }
  girar(flaps);

  // Filtros do painel.
  var botoes = document.querySelectorAll('.filtros button');
  botoes.forEach(function (b) {
    b.addEventListener('click', function () {
      var filtro = b.dataset.filtro;
      botoes.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var visiveis = [];
      flaps.forEach(function (f) {
        var linha = f.el.closest('.linha');
        var item = linha.parentElement;
        var mostra = filtro === 'todos' || linha.dataset.tipo === filtro;
        item.hidden = !mostra;
        if (mostra) visiveis.push(f);
      });
      if (!rodando) girar(visiveis);
    });
  });

  // INEMA News: primeiro a cópia publicada com o site, depois a edição ao vivo, se o navegador permitir.
  var lista = document.querySelector('[data-news]');
  if (!lista) return;
  var formato = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });

  function data(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function mostrar(itens) {
    var bons = itens.filter(function (n) { return n && n.date && n.url && n[lang] && n[lang].titulo; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })
      .slice(0, 5);
    if (!bons.length) return;
    lista.textContent = '';
    bons.forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'news-item';
      var a = document.createElement('a');
      a.href = n.url;
      a.rel = 'noopener';
      a.target = '_blank';
      var quando = document.createElement('time');
      quando.dateTime = n.date;
      quando.textContent = formato.format(data(n.date));
      var corpo = document.createElement('div');
      var titulo = document.createElement('strong');
      titulo.textContent = n[lang].titulo;
      corpo.appendChild(titulo);
      if (n[lang].resumo) {
        var resumo = document.createElement('span');
        resumo.textContent = n[lang].resumo;
        corpo.appendChild(resumo);
      }
      a.appendChild(quando);
      a.appendChild(corpo);
      li.appendChild(a);
      lista.appendChild(li);
    });
  }

  fetch('shared/news.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.items) mostrar(d.items); })
    .catch(function () {})
    .then(function () {
      var ctrl = window.AbortController ? new AbortController() : null;
      if (ctrl) setTimeout(function () { ctrl.abort(); }, 4000);
      return fetch('https://news.inema.pro/content-index.json', ctrl ? { signal: ctrl.signal } : {});
    })
    .then(function (r) { return r && r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.items) return;
      mostrar(d.items.map(function (n) {
        var t = n.translations || {};
        return { date: n.date, url: n.source_url, pt: t['pt-BR'], en: t.en, es: t.es };
      }));
    })
    .catch(function () {});
})();
