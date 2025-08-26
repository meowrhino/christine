Christine — Ítems Compass

Visualizador interactivo tipo “political‑compass” para posicionar proyectos/ítems en un plano X/Y según dos ejes seleccionables. Los ítems y sus coordenadas vienen de items.json. La interfaz permite elegir los ejes, centra el lienzo al cargar/redimensionar y abre un popup con detalles al hacer clic en cada ítem.

Estado del repo (este ZIP): contiene index.html, style.css, app.js, items.json y una carpeta de assets img/ con subcarpetas img/_arrows/ (top/right/bottom/left) para futuros indicadores cardinales.

⸻

1) Cómo ejecutar

La página usa fetch("items.json"), por lo que es recomendable servirla con un servidor estático local (evita problemas de CORS al abrir como file://).

# desde la carpeta que contiene ./christine
cd christine
python -m http.server 8000
# abre http://localhost:8000 en el navegador


⸻

2) Estructura de carpetas

christine/
├─ index.html          # HTML principal: canvas, ejes, menú (select de eje X/Y), popup
├─ style.css           # Estilos del lienzo, ejes, ítems, popup y menú
├─ app.js              # Lógica de carga/render, mapeo al canvas y eventos
├─ items.json          # Datos de ítems + coordenadas por eje
└─ img/
   └─ _arrows/         # (Preparado) indicadores para los bordes del viewport
      ├─ top/          # ej. SILLY.png, GRAPHIC.png, OPINIONATED.png, ...
      ├─ right/
      ├─ bottom/
      └─ left/


⸻

3) Modelo de datos (items.json)

Cada objeto describe un ítem posicionable y su contenido de popup.

{
  "id": 1,
  "titulo": "…",
  "ejes": {
    "Illustration/Graphic": 7,
    "Artwork/Commercial": 7,
    "Demure/Opinionated": -1,
    "Silly/Serious": 7
  },
  "descripcion": ["párrafo 1", "párrafo 2", "..."],
  "imagen": "img/ruta_principal.jpg",
  "miniatura": "",                  // (opcional, actualmente no se usa)
  "galeria": ["img/extra1.jpg", "video/clip.mp4"],
  "principal": ""                   // (campo reservado; no se usa aún)
}

	•	Ejes disponibles (detectados en este dataset): Illustration/Graphic, Artwork/Commercial, Demure/Opinionated, Silly/Serious.
	•	Rango actual de valores en ejes: -10..10 (el render mapea con margen -12..12).
	•	Si añades un eje nuevo, aparecerá automáticamente en los selectores.

⸻

4) Funcionamiento (alto nivel)

4.1 Flujo de arranque (app.js)
	•	cargarItems() → fetch("items.json") → extrae las claves de ejes y elige dos ejes distintos al azar para X e Y.
	•	renderizarSelectoresEjes() → rellena <select id="eje-x"> y <select id="eje-y"> evitando duplicados. Si el usuario elige el mismo eje en ambos, el código corrige automáticamente para que sean distintos.
	•	renderizarItems() → limpia y posiciona cada .item según los valores del ítem en los ejes elegidos.
	•	centrarScroll(true/false) → centra el viewport sobre el centro del #canvas (en carga y en resize).

4.2 Mapeo de coordenadas

Se usa:

mapToCanvas(val, /*min*/ -12, /*max*/ 12, /*size*/ canvasW_or_canvasH)

	•	Valores negativos → izquierda (X) o arriba (Y).
	•	Valores positivos → derecha (X) o abajo (Y).
	•	Cada ítem es un <div class="item"> posicionado absoluto dentro de #canvas.

4.3 Interacción
	•	Hover: escala/rota levemente el .item.
	•	Click en ítem: abre popup con:
	•	#popup-titulo (título del ítem)
	•	#popup-descripcion (cada string de descripcion como <p>)
	•	#popup-imagen (imagen principal; clic para abrir modal a tamaño grande)
	•	#popup-galeria (thumbnails; soporta imágenes y .mp4 con <video controls>)
	•	Cerrar: botón × o clic en fondo del popup/modal.

⸻

5) Estilos relevantes (style.css)
	•	#canvas usa 100dvw × 100dvh (en móvil duplica el tamaño: 2×).
	•	Ejes: #axis-x (línea horizontal) y #axis-y (vertical).
	•	Menú: #menu fijo abajo‑derecha con selectores #eje-x, #eje-y.
	•	Ítems (.item) son mosaicos con imagen y título; el tamaño base viene de CSS con unidades dvw/dvh.
	•	Popup y modal de imagen grande (#modal-img-grande) ya implementados.

Nota: actualmente no hay :root con paleta global. Añadiremos variables de color en el siguiente paso.

⸻

6) Preparado para mejoras (lo que vamos a añadir)

6.1 Paleta de colores en :root

Añadiremos estas variables (nombres sugeridos) al comienzo de style.css:

:root {
  --mint-apple:   #C9FF7F; /* acento menta */
  --slate-warm:   #686369; /* gris pizarra cálido */
  --rose-clay:    #BA9592; /* rosa arcilla suave */
  --neon-green:   #00FF00; /* highlight/estado activo */
  --aqua:         #00FFFF; /* cian de énfasis */
  --royal-blue:   #0000FF; /* azul intenso */
  --ink:          #000000; /* texto/contornos */
}

6.2 Indicadores cardinales (bordes del viewport)

Ya existen assets en img/_arrows/ con nombres de polos: ILLUSTRATION.png, GRAPHIC.png, SILLY.png, SERIOUS.png, DEMURE.png, OPINION.png/OPINIONATED.png, ARTWORK.png, COMMERCIAL.png.

Idea de implementación:
	1.	Añadir 4 slots al final de <body>:

<div id="slot-top"    class="cardinal-slot slot-top"    hidden></div>
<div id="slot-right"  class="cardinal-slot slot-right"  hidden></div>
<div id="slot-bottom" class="cardinal-slot slot-bottom" hidden></div>
<div id="slot-left"   class="cardinal-slot slot-left"   hidden></div>

	2.	CSS base:

.cardinal-slot {
  position: fixed; z-index: 5000; pointer-events: none;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.slot-top    { top:    12px; left: 50%; transform: translateX(-50%); }
.slot-bottom { bottom: 12px; left: 50%; transform: translateX(-50%); }
.slot-left   { left:   12px; top: 50%; transform: translateY(-50%); }
.slot-right  { right:  12px; top: 50%; transform: translateY(-50%); }
.cardinal-slot img { max-width: clamp(32px, 8vmin, 96px); max-height: clamp(32px, 8vmin, 96px); }

	3.	JS para mostrarlos según los ejes activos (convención: primer término = negativo → left/top; segundo = positivo → right/bottom):

function normPole(p){
  const up = p.toUpperCase().replace(/[^A-Z]/g, "");
  // Fallback de OPINIONATED→OPINION si falta el asset
  return (up === "OPINIONATED") ? "OPINIONATED" : up;
}
function setSlot(id, src){
  const el = document.getElementById(id);
  el.replaceChildren(); const img = new Image(); img.src = src; img.alt = id; el.appendChild(img);
  el.hidden = false;
}
function updateCardinalArrows(){
  const [leftLabel, rightLabel] = ejeX.split("/");
  const [topLabel,  bottomLabel] = ejeY.split("/");
  setSlot("slot-left",   `img/_arrows/left/${{normPole(leftLabel)}}.png`);
  setSlot("slot-right",  `img/_arrows/right/${{normPole(rightLabel)}}.png`);
  // Para Y consideramos el primer término como la parte superior (valores negativos)
  const topName = normPole(topLabel), bottomName = normPole(bottomLabel);
  // Fallback si no existiera OPINIONATED en alguna carpeta:
  const trySrc = (side, name) => [name, (name==="OPINIONATED"?"OPINION":name)].map(n=>`img/_arrows/${{side}}/${{n}}.png`);
  setSlot("slot-top",    trySrc("top", topName)[0]);
  setSlot("slot-bottom", trySrc("bottom", bottomName)[0]);
}
/* Llamar tras renderizar selectores y también en onchange de #eje-x / #eje-y */


⸻

7) Puntos a tener en cuenta
	•	El canvas usa dvw/dvh; en móviles se duplica el tamaño del lienzo para tener más “espacio de juego”.
	•	El mapeo de valores actualmente asume rango [-12,12]; tus datos están en [-10,10]. Si cambias el rango de los datos, ajusta las constantes en renderizarItems().
	•	Asegúrate de que imagen siempre apunte a un asset existente; no hay placeholder en app.js.
	•	Los nombres de polos deben coincidir con los assets en img/_arrows/*/*.png (mayúsculas). En el dataset usas “Demure/Opinionated”; en assets existe tanto OPINION.png como OPINIONATED.png. Hemos previsto fallback si hiciera falta.

⸻

8) Roadmap inmediato
	•	Añadir :root con la paleta proporcionada y aplicarla al menú/ejes/popups.
	•	Integrar los cardinal arrows con los 4 slots y updateCardinalArrows().
	•	(Opcional) Etiquetas de texto junto a los ejes con los polos activos.
	•	(Opcional) Normalizar estilos de .item img para evitar reglas duplicadas.

⸻

9) Créditos y licencia

Proyecto interno de exploración UI/UX. Uso de imágenes y textos con fines de portfolio/documentación.




NOTAS:

vale y me gustaria que el axis-x y el axis-y fuesen una linea dotted de color mint-apple :O 

#axis-x {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
}

#axis-y {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
}

#axis-x, axis-y {
  line: dotted mint green 
}