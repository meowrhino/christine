let itemsData = [];
let ejes = [];
let ejeX = "";
let ejeY = "";

// Carga los ítems y ejes, y pinta el canvas
async function cargarItems() {
  const respuesta = await fetch("items.json");
  itemsData = await respuesta.json();
  ejes = Object.keys(itemsData[0].ejes);

  // Selecciona ejes aleatorios distintos
  seleccionarEjesAleatorios();

  // Renderiza los selectores con las opciones válidas
  renderizarSelectoresEjes();
}

// Renderiza los selectores de ejes evitando duplicados
function renderizarSelectoresEjes() {
  const selectX = document.getElementById("eje-x");
  const selectY = document.getElementById("eje-y");

  // Guardar valor actual
  const currentX = ejeX;
  const currentY = ejeY;

  // Eje X
  selectX.innerHTML = "";
  ejes.forEach((eje) => {
    if (eje !== ejeY) {
      let optX = document.createElement("option");
      optX.value = eje;
      optX.textContent = eje;
      if (eje === ejeX) optX.selected = true;
      selectX.appendChild(optX);
    }
  });
  // Eje Y
  selectY.innerHTML = "";
  ejes.forEach((eje) => {
    if (eje !== ejeX) {
      let optY = document.createElement("option");
      optY.value = eje;
      optY.textContent = eje;
      if (eje === ejeY) optY.selected = true;
      selectY.appendChild(optY);
    }
  });

  // Listeners para actualizar ejes y re-renderizar items al cambiar selección
  selectX.onchange = function () {
    ejeX = selectX.value;
    if (ejeX === ejeY) {
      // Auto-cambia eje Y si colisiona
      ejeY = ejes.find((e) => e !== ejeX);
    }
    renderizarSelectoresEjes();
    renderizarItems();
  };
  selectY.onchange = function () {
    ejeY = selectY.value;
    if (ejeY === ejeX) {
      ejeX = ejes.find((e) => e !== ejeY);
    }
    renderizarSelectoresEjes();
    renderizarItems();
  };
}

// Selecciona dos ejes aleatorios distintos
function seleccionarEjesAleatorios() {
  let idx1 = Math.floor(Math.random() * ejes.length);
  let idx2;
  do {
    idx2 = Math.floor(Math.random() * ejes.length);
  } while (idx2 === idx1);

  ejeX = ejes[idx1];
  ejeY = ejes[idx2];
}

// Función para mapear valores de eje a coordenadas en canvas
function mapToCanvas(val, min, max, size) {
  return ((val - min) / (max - min)) * size;
}

// Renderiza los ítems en el canvas posicionándolos según los ejes seleccionados
function renderizarItems() {
  const canvas = document.getElementById("canvas");
  // Limpia ítems previos
  Array.from(canvas.querySelectorAll(".item")).forEach((el) => el.remove());

  // El tamaño de los ítems se basa en viewport y se usa un placeholder de imagen
  itemsData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.style.setProperty("--item-bg", item.colorFondo || "#b9bef7"); // color de fondo si existe

    const canvasW = canvas.offsetWidth;
    const canvasH = canvas.offsetHeight;

    // Posicionamiento con rango -12 a 12
    const x =
      mapToCanvas(item.ejes[ejeX], -12, 12, canvasW) -
      (div.offsetWidth / 2 || 40);
    const y =
      mapToCanvas(item.ejes[ejeY], -12, 12, canvasH) -
      (div.offsetHeight / 2 || 40);
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // Imagen obligatoria desde el JSON (sin fallback)
    // La imagen debe venir siempre del JSON, no se usa imagen por defecto
    const img = document.createElement("img");
    img.src = item.imagen;
    img.alt = item.titulo;
    div.appendChild(img);

    // Título debajo
    const tituloDiv = document.createElement("div");
    tituloDiv.className = "item-titulo";
    tituloDiv.textContent = item.titulo;
    div.appendChild(tituloDiv);

    // Click para mostrar popup
    div.onclick = (e) => {
      e.stopPropagation();
      mostrarPopup(item);
    };

    canvas.appendChild(div);
  });

  document.querySelectorAll(".item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const randomRotate = Math.random() * 6 - 3; // de -3° a +3°
      const randomScale = 1 + Math.random() * 0.1; // de 1 a 1.1

      item.style.transform = `scale(${randomScale.toFixed(
        2
      )}) rotate(${randomRotate.toFixed(2)}deg)`;
    });

    item.addEventListener("mouseleave", () => {
      // Vuelve a la normalidad
      item.style.transform = "";
    });
  });
}

// Popup con info detallada del ítem seleccionado
function mostrarPopup(item) {
  const popup = document.getElementById("popup");
  popup.classList.remove("oculto");
  document.getElementById("popup-titulo").textContent = item.titulo;
  document.getElementById("popup-descripcion").innerHTML = (item.descripcion || [])
    .map((p) => `<p>${p}</p>`)
    .join("");
  const popupImg = document.getElementById("popup-imagen");
  popupImg.src = item.imagen || item.miniatura || "";
  popupImg.style.objectFit = "contain";
  popupImg.style.maxWidth = "95%";
  popupImg.style.maxHeight = "40vh";
  popupImg.style.cursor = "zoom-in";
  popupImg.onclick = (e) => {
    e.stopPropagation();
    mostrarPopupGrande(popupImg.src);
  };
  document.getElementById("popup-galeria").innerHTML = (item.galeria || [])
    .map((src) =>
      src.match(/\.(mp4)$/i)
        ? `<video src="${src}" controls style="max-width:120px;max-height:120px;"></video>`
        : `<img src="${src}" style="max-width:120px;max-height:120px;">`
    )
    .join("");
}

// Cerrar popup al hacer click en botón cerrar
document.getElementById("cerrar-popup").onclick = (e) => {
  document.getElementById("popup").classList.add("oculto");
};
// Click fuera del popup también lo cierra
document.getElementById("popup").onclick = (e) => {
  if (e.target === document.getElementById("popup")) {
    document.getElementById("popup").classList.add("oculto");
  }
};

// Inicializa todo al cargar la ventana
window.onload = async function () {
  await cargarItems();
  renderizarItems();
  
  generateCardinalArrows();
  showLastClickedAsTarget();          // ← radar y target central, nombre más claro
  centrarScroll(true);   // Scroll inmediato al centro
  setTimeout(() => centrarScroll(false), 350); // Luego animación suave
};

window.addEventListener("resize", () => {
  renderizarItems();
  centrarScroll(true);
  setTimeout(() => centrarScroll(false), 300);
});

function centrarScroll(forceAuto = false) {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  let intentos = 0;
  function intentar() {
    // Calcula el centro absoluto del canvas (por si el canvas no empieza en 0,0)
    const rect = canvas.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const centerX = canvas.offsetLeft + canvas.offsetWidth / 2 - window.innerWidth / 2;
    const centerY = canvas.offsetTop + canvas.offsetHeight / 2 - window.innerHeight / 2;

    window.scrollTo({
      left: centerX,
      top: centerY,
      behavior: forceAuto ? "auto" : "smooth"
    });
    intentos++;
    if (intentos < 14) setTimeout(intentar, 130);
  }
  const delay = /Mobi|Android/i.test(navigator.userAgent) ? 250 : 70;
  setTimeout(intentar, delay);
}

function mostrarPopupGrande(src) {
  let modal = document.getElementById("modal-img-grande");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-img-grande";
    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<img src="${src}" class="popup-img-grande">`;
  modal.style.display = "flex";
}

// --- Cardinal Arrows ---
function normalizePole(label) {
  return String(label || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function setSlotImg(slotId, side, poleName) {
  const slot = document.getElementById(slotId);
  if (!slot) return;
  slot.replaceChildren();

  const img = new Image();
  img.className = "cardinal-img";
  img.alt = `${side}-${poleName}`;
  img.src = `img/_arrows/${side}/${poleName}.png`;
  img.onerror = () => {
    console.log(`[arrows] missing asset: img/_arrows/${side}/${poleName}.png`);
    slot.replaceChildren(); // dejar vacío si falta
  };
  slot.appendChild(img);
}

/**
 * Genera/actualiza las flechas cardinales según los ejes activos.
 * Convención:
 *  - Eje X:  "Left/Right"  → left = etiqueta IZQUIERDA, right = DERECHA
 *  - Eje Y:  "Top/Bottom"  → top = etiqueta SUPERIOR (valores negativos),
 *                             bottom = INFERIOR (positivos)
 */
function generateCardinalArrows() {
  const [leftLabel, rightLabel]  = String(ejeX).split("/");
  const [topLabel,  bottomLabel] = String(ejeY).split("/");

  setSlotImg("slot-left",   "left",   normalizePole(leftLabel));
  setSlotImg("slot-right",  "right",  normalizePole(rightLabel));
  setSlotImg("slot-top",    "top",    normalizePole(topLabel));
  setSlotImg("slot-bottom", "bottom", normalizePole(bottomLabel));
}

// --- Radar y Target Central ---
function showLastClickedAsTarget(){
  const c = document.getElementById("axis-center");
  if (!c) return;

  c.addEventListener('mouseenter', () => document.body.classList.add('radar-active'));
  c.addEventListener('mouseleave', () => document.body.classList.remove('radar-active'));

  // click / pointer sobre el centro: activa radar (desktop y táctil moderno)
  c.addEventListener('pointerdown', () => {
    document.body.classList.add('radar-active');
    setTimeout(() => document.body.classList.remove('radar-active'), 1400);
  });
}

// === Mouse Axes (actualiza --mouse-x / --mouse-y en tiempo real) ===
(() => {
  const rootStyle = document.documentElement.style;
  let px = null, py = null, raf = 0;

  function commit() {
    raf = 0;
    if (px == null || py == null) return;
    rootStyle.setProperty('--mouse-x', px + 'px');
    rootStyle.setProperty('--mouse-y', py + 'px');
  }

  function onMove(clientX, clientY) {
    px = Math.max(0, Math.min(window.innerWidth,  clientX));
    py = Math.max(0, Math.min(window.innerHeight, clientY));
    if (!raf) raf = requestAnimationFrame(commit);
  }

  // ratón
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY), { passive: true });

  // pointer (unificado: ratón, lápiz, touch)
  if (window.PointerEvent) {
    window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerdown', (e) => onMove(e.clientX, e.clientY), { passive: true });
  }

  // táctil
  window.addEventListener('touchmove', (e) => {
    const t = e.touches && e.touches[0];
    if (t) onMove(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    const t = e.touches && e.touches[0];
    if (t) onMove(t.clientX, t.clientY);
  }, { passive: true });

  // inicial: centro (por si no hay movimiento aún)
  onMove(window.innerWidth / 2, window.innerHeight / 2);
})();

