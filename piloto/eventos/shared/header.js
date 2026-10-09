// Fecha o menu de áreas ao clicar fora ou apertar Esc. O menu funciona sem este arquivo.
(function () {
  var menu = document.querySelector('.event-areas');
  if (!menu) return;
  document.addEventListener('click', function (e) {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
})();
