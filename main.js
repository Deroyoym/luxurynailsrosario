/* ============================================================
   Luxury Nails Rosario — main.js
   Funciones: Menú móvil, Carrusel de imágenes, Scroll suave
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     MENÚ MÓVIL
  ---------------------------------------------------------- */
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav__link');

  function toggleMenu() {
    const isOpen = nav.classList.toggle('nav--open');
    menuBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    nav.classList.remove('nav--open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', toggleMenu);

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Cerrar al clickear fuera del nav
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('nav--open') &&
        !nav.contains(e.target) &&
        !menuBtn.contains(e.target)) {
      closeMenu();
    }
  });

  /* ----------------------------------------------------------
     CARRUSEL
  ---------------------------------------------------------- */
  const track = document.getElementById('carouselTrack');
  const slides = track ? Array.from(track.children) : [];
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const dotsContainer = document.getElementById('carouselDots');

  if (track && slides.length > 0) {
    let currentIndex = 0;
    const visibleSlides = getVisibleSlides();

    // Crear dots
    slides.forEach(function (_, i) {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === 0 ? ' carousel__dot--active' : '');
      dot.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
      dot.addEventListener('click', function () {
        goTo(i);
      });
      dotsContainer.appendChild(dot);
    });

    function getVisibleSlides() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function getSlideWidth() {
      const slide = slides[0];
      const style = window.getComputedStyle(slide);
      return slide.offsetWidth + parseInt(style.marginRight || 0) + 20;
    }

    function updateDots() {
      const dots = dotsContainer.querySelectorAll('.carousel__dot');
      dots.forEach(function (dot, i) {
        dot.classList.toggle('carousel__dot--active', i === currentIndex);
      });
    }

    function goTo(index) {
      const maxIndex = Math.max(0, slides.length - getVisibleSlides());
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      const slideW = getSlideWidth();
      track.style.transform = 'translateX(-' + (currentIndex * slideW) + 'px)';
      updateDots();
    }

    prevBtn.addEventListener('click', function () {
      goTo(currentIndex - 1);
    });

    nextBtn.addEventListener('click', function () {
      goTo(currentIndex + 1);
    });

    // Swipe táctil
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
      }
    }, { passive: true });

    // Auto play
    let autoPlay = setInterval(function () {
      const maxIndex = Math.max(0, slides.length - getVisibleSlides());
      goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }, 3500);

    track.addEventListener('mouseenter', function () {
      clearInterval(autoPlay);
    });

    track.addEventListener('mouseleave', function () {
      autoPlay = setInterval(function () {
        const maxIndex = Math.max(0, slides.length - getVisibleSlides());
        goTo(currentIndex >= maxIndex ? 0 : currentIndex + 1);
      }, 3500);
    });

    // Resize
    window.addEventListener('resize', function () {
      goTo(0);
    });
  }

  /* ----------------------------------------------------------
     HEADER SCROLL
  ---------------------------------------------------------- */
  const header = document.querySelector('.header');

  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 20px rgba(0,0,0,.08)';
      } else {
        header.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     ANIMACIÓN AL HACER SCROLL (Intersection Observer)
  ---------------------------------------------------------- */
  const animatedEls = document.querySelectorAll(
    '.service-card, .product-card, .press-on__info-card, .about__badges, .faq__item'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    animatedEls.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .5s ease ' + (i * 0.06) + 's, transform .5s ease ' + (i * 0.06) + 's';
      observer.observe(el);
    });
  }

})();
