# Ítems Compass — Christine

Proyecto web interactivo para visualizar un conjunto de ítems sobre un lienzo (canvas) con ejes X/Y seleccionables.  
Inspirado en el estilo de “Christine Janjira Meyer”.

---

## Estructura

Sigue la receta del estudio ([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Para
editar: [GUIA.md](GUIA.md). Si el build falla: [CLAUDE.md](CLAUDE.md).

- **data/site.json**: el nombre y, en `lists`, qué proyectos salen en el lienzo.
- **projects/<slug>/**: un proyecto: `project.json` (`title`, `axes` de -12 a 12, `text`) y su
  imagen, `1.webp`.
- **schema/**: qué campos lleva cada JSON (VS Code, el build y la vista previa).
- **build/build.mjs**: → `dist/`: revisa los JSON (y que todos lleven los mismos ejes), escribe lo
  que se lee sin JS y la imagen para compartir (sharp). Lo publica la Action en GitHub Pages.
- **js/carga.js**, **js/house.js**: leen los JSON (y los revisan en la vista previa) y los pasan a
  la forma del `items.json` de antes, que es la que lee `app.js`.
- **index.html**: contiene el esqueleto de la página.
  - `<div id="canvas">` es el contenedor central.
  - `#axis-x` y `#axis-y` dibujan los ejes cruzados.
  - `#brand` muestra el nombre arriba a la izquierda (sirve también de botón *About*).
  - `#menu` abajo con los dos selectores de ejes.
  - `#popup` y slots cardinales (`slot-top/right/bottom/left`) para detalles y flechas.
- **style.css**: variables, paleta, radar central, ejes, ítems, menú, popup y flechas.
- **app.js**: genera los ítems en el lienzo, elige dos ejes al azar (cambiables en el menú),
  posiciona cada ítem de -12 a 12, hover, popup y flechas cardinales.

## Cómo funciona el menú y el brand (etiquetas elásticas)

- Cada `select` tiene una capa `.select-faux` con un SVG `<text>` dibujado a gran tamaño.
- En `fitFauxSVG` se mide el `getBBox()` del texto y se ajusta el `viewBox` para que se escale al tamaño de la placa negra.
- El brand (`#brand .brand-faux`) funciona igual, usando `data-label`.

Esto genera un texto que siempre rellena la altura de la placa, aunque se deforma horizontalmente para encajar.

---

## Problema pendiente: hueco negro bajo el texto

En la práctica, en **todos los navegadores** queda un pequeño margen/banda negra debajo del texto (sobre todo visible en el brand superior).  
Esto se debe a cómo los motores SVG calculan `getBBox` y aplican `dominant-baseline`. El bounding box incluye parte del “leading” interno de la fuente, por lo que el texto nunca rellena al 100%.

### Lo que hemos probado

1. **Ajuste de baseline** (`hanging`, `text-before-edge`, `central`) → sin éxito, siempre deja aire.
2. **Fudge en viewBox** (sumar/restar 1px o 2%) → hace el texto más pequeño o recortado, no elimina el hueco de forma estable.
3. **Overshoot vertical** (scaleY(1.03), translateY(-1px)) → tapa en algunos navegadores, en otros apenas cambia.
4. **HTML fallback (`.elastic-label`)** → mejor control, pero igualmente queda banda porque medir texto en HTML con `getBoundingClientRect` incluye leading vertical.
5. **Detectar iOS / mobile y aplicar más recorte** → tampoco consistente, el problema ocurre también en desktop.

### Estado actual

- Se mantiene la versión SVG (`fitFauxSVG`), que funciona pero con ese “gap”.
- El resto del sistema (items, ejes, radar, popup) funciona correctamente.
- Aceptamos de momento este defecto visual hasta retomarlo más adelante.

---

## Qué falta por hacer / próximas ideas

- [ ] Resolver definitivamente el problema de **alineado vertical de los labels**.
  - Posibles vías: 
    - Usar `<foreignObject>` con texto HTML real dentro del SVG.
    - Precalcular métricas de la fuente (ascent/descent) con librerías tipo [opentype.js](https://opentype.js.org/).
    - Forzar clipping del SVG con `overflow:hidden` y un overshoot agresivo.
- [ ] Eliminar duplicados de CSS (`Elastic Menu` antiguo vs `MENU: wrappers…`).
- [ ] Unificar la lógica: que solo exista **una** función de render de labels (actualmente hay varios parches).
- [ ] Revisar responsive en móvil (el brand y los selects se cortan en pantallas estrechas).

---

## Cómo ejecutar

1. Live Server sobre la carpeta (la vista previa: si un JSON está mal, sale en pantalla).
2. Para la web tal cual se publica: `npm ci && node build/build.mjs` → `dist/`.

---

## Conclusión

El proyecto está estable para pruebas y demos, salvo el detalle visual del gap bajo el texto.  
Se ha intentado varias aproximaciones pero ninguna es cross-browser perfecta. Queda documentado aquí para retomarlo más adelante.