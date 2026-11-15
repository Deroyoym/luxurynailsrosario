/* Luxury Nails Rosario — menú móvil y borde del header al hacer scroll */

(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  var header = document.querySelector('.header');

  function setMenu(open) {
    nav.classList.toggle('nav--open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Menú');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(!nav.classList.contains('nav--open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });

    // Si se agranda la ventana con el menú abierto, no dejar el scroll bloqueado
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle('header--scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
