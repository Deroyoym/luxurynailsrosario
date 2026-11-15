// Genera el sitio en dist/ a partir de plantilla.html y los archivos de contenido/.
// Sin dependencias: `node build.mjs`. Vercel lo corre en cada publicación (ver vercel.json).

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, openSync, readSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');

const leer = (nombre) => JSON.parse(readFileSync(join(root, 'contenido', `${nombre}.json`), 'utf8'));

const inicio = leer('inicio');
const galeria = leer('galeria');
const sobre = leer('quien-soy');
const servicios = leer('servicios');
const presson = leer('press-on');
const preguntas = leer('preguntas');
const contacto = leer('contacto');
const iconos = JSON.parse(readFileSync(join(root, 'iconos.json'), 'utf8'));

/* ---------- utilidades ---------- */

const attr = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Texto visible: se escapa el HTML y los saltos de línea pasan a <br>
const txt = (v) => attr(String(v ?? '').trim()).replace(/\r?\n/g, '<br>');

const lista = (v) => (Array.isArray(v) ? v : []);

// El CMS puede guardar la ruta con o sin barra inicial
const src = (v) => String(v ?? '').replace(/^\/+/, '');

const soloDigitos = (v) => String(v ?? '').replace(/\D/g, '');

// Ancho y alto reales de la imagen, para que la página no salte al cargar
function medidas(ruta) {
  try {
    const fd = openSync(join(root, ruta), 'r');
    const b = Buffer.alloc(64 * 1024);
    const n = readSync(fd, b, 0, b.length, 0);
    closeSync(fd);

    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const tipo = b.toString('ascii', 12, 16);
      if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (tipo === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
    if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < n) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
        }
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch { /* sin medidas: la imagen se muestra igual */ }
  return null;
}

function img(ruta, alt, extra = '') {
  const r = src(ruta);
  if (!r) return '';
  const m = medidas(r);
  const dims = m ? ` width="${m.w}" height="${m.h}"` : '';
  return `<img src="${attr(r)}" alt="${attr(alt)}"${extra}${dims}>`;
}

const icono = (clave, tam) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">${iconos[clave] ?? iconos.flor}</svg>`;

const whatsapp = soloDigitos(contacto.whatsapp);
const instagram = String(contacto.instagram ?? '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/+$/, '');

/* ---------- bloques ---------- */

const bloques = {
  preload_galeria: () => {
    const primera = lista(galeria.fotos)[0];
    return primera ? `<link rel="preload" fetchpriority="high" as="image" href="${attr(src(primera.imagen))}">` : '';
  },

  hero_imagen: () => img(inicio.imagen, inicio.imagen_descripcion, ' loading="eager"'),

  galeria: () => lista(galeria.fotos).map((f, i) => `        <div class="carousel__slide">
          <div class="carousel__img-placeholder">
            ${img(f.imagen, f.descripcion || f.etiqueta, i === 0 ? '' : ' loading="lazy"')}
            <span>${txt(f.etiqueta)}</span>
          </div>
        </div>`).join('\n'),

  sobre_imagen: () => img(sobre.imagen, sobre.imagen_descripcion, ' loading="eager"'),

  sobre_parrafos: () => lista(sobre.parrafos).map((p) => `        <p class="about__text">
          ${txt(p)}
        </p>`).join('\n'),

  sobre_cifras: () => lista(sobre.cifras).map((c) => `          <div class="about__badge">
            <span class="about__badge-number">${txt(c.numero)}</span>
            <span class="about__badge-label">${txt(c.etiqueta)}</span>
          </div>`).join('\n'),

  servicios: () => lista(servicios.lista).map((s) => {
    const etiquetas = [
      s.recomendado && `            <span class="service-card__tag service-card__tag--yes">${txt(s.recomendado)}</span>`,
      s.no_recomendado && `            <span class="service-card__tag service-card__tag--no">${txt(s.no_recomendado)}</span>`,
    ].filter(Boolean).join('\n');
    return `
        <article class="service-card${s.destacado ? ' service-card--featured' : ''}">${s.destacado ? `
          <div class="service-card__badge">Más pedido</div>` : ''}
          <div class="service-card__icon">✦</div>
          <h3 class="service-card__title">${txt(s.titulo)}</h3>
          <p class="service-card__desc">
            ${txt(s.descripcion)}
          </p>${etiquetas ? `
          <div class="service-card__tags">
${etiquetas}
          </div>` : ''}
        </article>`;
  }).join('\n') + '\n',

  presson_info: () => lista(presson.info).map((c) => `          <div class="press-on__info-card">
            <span class="press-on__info-icon">${icono(c.icono, 28)}</span>
            <h3>${txt(c.titulo)}</h3>
            <p>${txt(c.texto)}</p>
          </div>`).join('\n'),

  presson_comparativa: () => lista(presson.comparativa).map((f) => `          <div class="compare-table__row">
            <div class="compare-table__cell compare-table__cell--label">${txt(f.caracteristica)}</div>
            <div class="compare-table__cell">${txt(f.soft_gel)}</div>
            <div class="compare-table__cell compare-table__cell--alt">${txt(f.press_on)}</div>
          </div>`).join('\n'),

  presson_productos: () => lista(presson.productos).map((p) => {
    const mensaje = encodeURIComponent(`Hola! Me interesa el ${String(p.nombre ?? '').trim()}`);
    return `
          <article class="product-card">
            <div class="product-card__img-placeholder">${img(p.imagen, p.nombre, ' loading="lazy"')}</div>
            <div class="product-card__body">
              <h4 class="product-card__name">${txt(p.nombre)}</h4>
              <p class="product-card__desc">${txt(p.descripcion)}</p>
              <a href="https://wa.me/${whatsapp}?text=${mensaje}" target="_blank" rel="noopener noreferrer" class="btn btn--sm">Consultar</a>
            </div>
          </article>`;
  }).join('\n') + '\n',

  faq: () => lista(preguntas.lista).map((q) => `
        <details class="faq__item">
          <summary class="faq__question">${txt(q.pregunta)}</summary>
          <div class="faq__answer">
            <p>${txt(q.respuesta)}</p>
          </div>
        </details>`).join('\n') + '\n',
};

const valores = {
  whatsapp,
  instagram: attr(instagram),
  tienda_url: attr(String(contacto.tienda_url ?? '').trim()),
  direccion_calle: attr(contacto.direccion_calle),
  'hero.imagen': attr(src(inicio.imagen)),
  'hero.etiqueta': txt(inicio.etiqueta),
  'hero.titulo': txt(inicio.titulo),
  'hero.subtitulo': txt(inicio.subtitulo),
  'sobre.titulo': txt(sobre.titulo),
  'servicios.intro': txt(servicios.intro),
  'presson.intro': txt(presson.intro),
  'presson.comparativa_titulo': txt(presson.comparativa_titulo),
  'contacto.texto': txt(contacto.texto),
  'contacto.direccion': [contacto.direccion_calle, contacto.direccion_ciudad].filter(Boolean).map(txt).join(' · '),
  'contacto.entregas': txt(contacto.entregas),
  'contacto.horario': txt(contacto.horario),
};

/* ---------- armado ---------- */

let html = readFileSync(join(root, 'plantilla.html'), 'utf8');

html = html.replace(/\{\{>\s*([\w.]+)\s*\}\}/g, (_, nombre) => {
  if (!(nombre in bloques)) throw new Error(`Bloque desconocido en la plantilla: ${nombre}`);
  return bloques[nombre]();
});
html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, nombre) => {
  if (!(nombre in valores)) throw new Error(`Valor desconocido en la plantilla: ${nombre}`);
  return valores[nombre];
});

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);

for (const f of ['styles.css', 'main.js', 'robots.txt', 'sitemap.xml', 'img', 'fonts', 'admin']) {
  if (existsSync(join(root, f))) cpSync(join(root, f), join(out, f), { recursive: true });
}

console.log(`Sitio generado en dist/ (${html.length} caracteres de HTML)`);
