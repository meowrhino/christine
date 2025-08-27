# Christine — Ejes interactivos + arrows cardinales

Visualizador tipo “compass” para posicionar proyectos/ítems en un plano X/Y con:
- **Ejes centrales** que nacen desde el centro (dos mitades por eje) con patrón configurable.
- **Arrows cardinales** pegadas a sangre en los 4 bordes.
- **Ejes del ratón / dedo** que nacen desde la última posición del puntero.
- **Radar** (onda elíptica) cuando apuntas o tocas el centro.
- Layout con **márgenes paramétricos** y paleta en `:root`.

---

## Ejecutar
Cualquier servidor estático vale:
```bash
cd christine
python -m http.server 8000
# http://localhost:8000
```

## Estructura
```
christine/
├─ index.html          # HTML principal (canvas, ejes, menú, popup, mouse-axes)
├─ style.css           # Paleta, layout, ejes, arrows, mouse-axes, radar
├─ app.js              # Carga datos, posiciona ítems, selectores, móvil/ratón
├─ items.json          # Datos de ítems y coordenadas por eje
└─ img/_arrows/{top,right,bottom,left}/  # assets de polos (PNG/SVG)
```

---

## Variables en `:root` (resumen)
```css
/* Márgenes y área útil */
--frame-v: 5dvh;                      /* margen arriba/abajo  */
--frame-h: 2.5dvw;                    /* margen izquierda/dcha */
--content-h: calc(100dvh - 2*var(--frame-v));
--content-w: calc(100dvw - 2*var(--frame-h));

/* Paleta */
--mint-apple:#c9ff7f; --slate-warm:#686369; --rose-clay:#ba9592;

/* Arrows */
--cardinal-width-x:  clamp(96px, 10vw, 200px);  /* L/R → width fijo, height auto */
--cardinal-height-y: clamp(96px, 10vh, 200px);  /* T/B → height fijo, width auto */

/* Ejes (patrón) */
--axis-thickness: 2px;
--axis-dash: 16px;
--axis-gap: 12px;
--axis-phase-x: -8px;
--axis-phase-y: -8px;

/* Radar */
--radar-color: var(--rose-clay);
--radar-stroke: 2px;
--radar-duration: 1400ms;
--radar-delay: 500ms;
```
- Editando estas variables lo ajustas **todo** (márgenes, ejes, arrows, radar) sin tocar HTML/JS.

---

## Colocación de ítems
- Cada ítem tiene valores de eje en `[-12, 12]` (datos actuales en `[-10,10]`).
- Se mapea a píxeles con `mapToCanvas(val, -12, 12, size)`.
- **Centrado real**: se crea el `.item`, se añade al DOM, se miden `offsetWidth/Height` y se resta su **mitad**:
  ```js
  const x = mapToCanvas(item.ejes[ejeX], -12, 12, canvasW) - (itemW/2);
  const y = mapToCanvas(item.ejes[ejeY], -12, 12, canvasH) - (itemH/2);
  ```
- Esto evita sesgos en móvil (donde el tamaño de los ítems difiere del desktop).

---

## Ejes centrales “desde el centro”
- `#axis-x` y `#axis-y` se dibujan con `::before/::after` (mitad izquierda/derecha y arriba/abajo).
- Patrón con `repeating-linear-gradient` usando `--axis-thickness`, `--axis-dash`, `--axis-gap` y **fase** `--axis-phase-x/y`.

## Arrows cardinales (bordes)
- LEFT/RIGHT usan `width: var(--cardinal-width-x); height:auto`.
- TOP/BOTTOM usan `height: var(--cardinal-height-y); width:auto`.
- `generateCardinalArrows()` pinta según los ejes activos. Si falta un asset, **se loguea** y el slot se deja vacío.

## Ejes del ratón / dedo
- Capa `#mouse-axes` está **oculta** al cargar; se activa al primer movimiento / tap real:
  - JS añade `body.mouse-axes-active` y actualiza `--mouse-x/--mouse-y` (en px).
  - En iOS se usan unidades `dvh` para que no se corte la mitad superior.

## Radar (centro)
- Dos ondas (`#canvas::before/::after`) que escalan 0.05→1 y se desvanecen.
- Se activa al over / tap del elemento `#axis-center` (o cerca del centro en desktop si se habilita).

---

## Móvil
- **Scroll de página** se bloquea **solo** mientras arrastras sobre el `#canvas`; el popup mantiene su scroll.
- Unidades `dvh` evitan saltos por la barra de iOS.
- El dedo funciona como ratón vía Pointer Events.

---

## Tips
- Cambia tamaño y separación del patrón: `--axis-dash`, `--axis-gap`, `--axis-thickness`.
- Ajusta “fase” desde el centro: `--axis-phase-x`, `--axis-phase-y`.
- Ajusta tamaño de arrows: `--cardinal-width-x`, `--cardinal-height-y`.
- Ajusta márgenes: `--frame-v`, `--frame-h`.