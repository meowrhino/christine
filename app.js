let itemsData = [];
let ejes = [];
let ejeX = "";
let ejeY = "";

// =============================
// 1) Estado & utilidades
// =============================

let radarFadeTimer = null; // controla el fade-out del radar

// Carga los ítems y ejes, y pinta el canvas
async function cargarItems() {
  const respuesta = await fetch("items.json");
  itemsData = await respuesta.json();
  ejes = Object.keys(itemsData[0].ejes);

  // Selecciona ejes aleatorios distintos
  seleccionarEjesAleatorios();

  // Renderiza los selectores con las opciones válidas
  renderizarSelectoresEjes();
  syncElasticMenuLabels();
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
    syncElasticMenuLabels();
    renderizarItems();
    generateCardinalArrows();
  };

  selectY.onchange = function () {
    ejeY = selectY.value;
    if (ejeY === ejeX) {
      ejeX = ejes.find((e) => e !== ejeY);
    }
    renderizarSelectoresEjes();
    syncElasticMenuLabels();
    renderizarItems();
    generateCardinalArrows();
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

// Lee una variable CSS (ms) desde :root de forma segura
function msFromVar(name, fallback) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

// Programa un "fade-out" suave del radar
function scheduleRadarFade() {
  document.body.classList.remove("radar-active");
  document.body.classList.add("radar-fade");
  clearTimeout(radarFadeTimer);
  const dur = msFromVar("--radar-duration", 1400);
  const del = msFromVar("--radar-delay", 400);
  radarFadeTimer = setTimeout(() => {
    document.body.classList.remove("radar-fade");
  }, dur + del + 80);
}

// Ángulo aleatorio en rango [-max,+max]
function randomAngle(max = 15) {
  return Math.random() * (max * 2) - max;
}

/* ===========================================================
   Elastic faux labels (SVG tight bbox + viewBox fill) - GLOBAL
   =========================================================== */
function __ensureElasticSVG(faux) {
  let svg = faux.querySelector(".elastic-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("elastic-svg");
    svg.setAttribute("preserveAspectRatio", "none"); // fill & distort
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", "0");
    t.setAttribute("y", "0");
    t.setAttribute("dominant-baseline", "hanging");
    svg.appendChild(t);
    faux.appendChild(svg);
  }
  return svg;
}

function fitFauxSVG(faux, text) {
  const svg = __ensureElasticSVG(faux);
  const t = svg.querySelector("text");
  const upper = (text || "").toUpperCase();
  t.textContent = upper;

  // Fuerza familia/peso heavy (no dependas del computed 400)
  const fam = `"CooperHewitt-Heavy", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  const wgt = "900";
  const color = getComputedStyle(faux).color || "currentColor";
  t.setAttribute("style", `font-family:${fam};font-weight:${wgt};font-kerning:normal;fill:${color}`);

  t.removeAttribute("transform");
  t.setAttribute("font-size", "300px");

  const bb = t.getBBox();
  const fudge = 0.0;
  const w = Math.max(1, bb.width);
  const h = Math.max(1, bb.height);
  t.setAttribute("transform", `translate(${-bb.x - fudge},${-bb.y - fudge})`);
  svg.setAttribute("viewBox", `0 0 ${w + fudge * 2} ${h + fudge * 2}`);
}


/**
 * Actualiza las etiquetas elásticas de los selectores del menú (SVG).
 * Busca: .select-wrap → <select> + .select-faux (contenedor para el SVG).
 */
function syncElasticMenuLabels(container = "#menu") {
  const root =
    typeof container === "string"
      ? document.querySelector(container)
      : container;
  if (!root) return;
  root.querySelectorAll(".select-wrap").forEach((wrap) => {
    const select = wrap.querySelector("select");
    const faux = wrap.querySelector(".select-faux");
    if (!select || !faux) return;
    const opt = select.options[select.selectedIndex];
    fitFauxSVG(faux, opt ? opt.textContent : "");
  });
}

// =============================
// 3) Render de ítems (imagen + rotación base + hover)
// =============================

function renderizarItems() {
  const canvas = document.getElementById("canvas");
  if (!canvas || !itemsData || !itemsData.length) return;

  // Limpia ítems previos
  Array.from(canvas.querySelectorAll(".item")).forEach((el) => el.remove());

  // Mide el canvas una sola vez por render
  const canvasW = canvas.offsetWidth;
  const canvasH = canvas.offsetHeight;

  itemsData.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    if (item.colorFondo) {
      div.style.setProperty("--item-bg", item.colorFondo);
    }

    // Rotación base inicial (±15º), persistente mientras no haya hover
    const baseRot = randomAngle(15);
    div.dataset.rotBase = baseRot.toFixed(2);
    div.style.transform = `rotate(${div.dataset.rotBase}deg)`;

    // Contenido (solo imagen por id)
    const img = document.createElement("img");
    img.src = `img/_items/${item.id}.png`;
    img.alt = item.titulo || "";
    div.appendChild(img);

    // Añadir al DOM ANTES de medir
    canvas.appendChild(div);

    // Posicionamiento
    function position() {
      const w = div.offsetWidth || img.naturalWidth || 80;
      const h = div.offsetHeight || img.naturalHeight || 80;
      const x = mapToCanvas(item.ejes[ejeX], -12, 12, canvasW) - w / 2;
      const y = mapToCanvas(item.ejes[ejeY], -12, 12, canvasH) - h / 2;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
    }

    position();
    if (!img.complete) img.addEventListener("load", position, { once: true });

    // Click para popup
    div.onclick = (e) => {
      e.stopPropagation();
      mostrarPopup(item);
    };
  });

  // Hover: rotación nueva (±15º) y z-index alto mientras hover
  canvas.querySelectorAll(".item").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const base = parseFloat(el.dataset.rotBase || "0");
      const delta = randomAngle(15);
      const target = (base + delta).toFixed(2);
      el.dataset.rotHover = target;
      el.style.zIndex = "999";
      el.style.transform = `rotate(${target}deg)`;
    });
    el.addEventListener("mouseleave", () => {
      const base = parseFloat(el.dataset.rotBase || "0").toFixed(2);
      el.style.transform = `rotate(${base}deg)`;
      el.style.zIndex = "";
    });
  });
}

// =============================
// 4) Popup (detalle de ítem)
// =============================

function mostrarPopup(item) {
  const popup = document.getElementById("popup");
  popup.classList.remove("oculto");
  document.getElementById("popup-titulo").textContent = item.titulo;
  document.getElementById("popup-descripcion").innerHTML = (item.descripcion || [])
    .map((p) => `<p>${p}</p>`)
    .join("");
  const popupImg = document.getElementById("popup-imagen");
  popupImg.src = `img/_items/${item.id}.png`;
  popupImg.onerror = () => {
    if (item.imagen || item.miniatura) {
      popupImg.src = item.imagen || item.miniatura;
    }
  };
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

// =============================
// 5) Flechas cardinales (bordes)
// =============================

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

function generateCardinalArrows() {
  const [leftLabel, rightLabel] = String(ejeX).split("/");
  const [topLabel, bottomLabel] = String(ejeY).split("/");

  setSlotImg("slot-left", "left", normalizePole(leftLabel));
  setSlotImg("slot-right", "right", normalizePole(rightLabel));
  setSlotImg("slot-top", "top", normalizePole(topLabel));
  setSlotImg("slot-bottom", "bottom", normalizePole(bottomLabel));
}

// =============================
// 6) Radar & centro
// =============================

function showLastClickedAsTarget() {
  let c = document.getElementById("axis-center");
  if (!c) {
    c = document.createElement("div");
    c.id = "axis-center";
  }
  const __canvasForCenter = document.getElementById("canvas");
  if (__canvasForCenter && c.parentElement !== __canvasForCenter) {
    __canvasForCenter.appendChild(c);
  }

  c.addEventListener("mouseenter", () => {
    clearTimeout(radarFadeTimer);
    document.body.classList.remove("radar-fade");
    document.body.classList.add("radar-active");
  });
  c.addEventListener("mouseleave", () => {
    const grace = 120;
    setTimeout(() => {
      if (!c.matches(":hover")) scheduleRadarFade();
    }, grace);
  });

  c.addEventListener("pointerdown", () => {
    clearTimeout(radarFadeTimer);
    document.body.classList.remove("radar-fade");
    document.body.classList.add("radar-active");
    setTimeout(() => {
      scheduleRadarFade();
    }, 3000);
  });

  window.addEventListener("pointerdown", (e) => {
    const cx = window.innerWidth / 2,
      cy = window.innerHeight / 2;
    const hit =
      Math.max(Math.abs(e.clientX - cx), Math.abs(e.clientY - cy)) <= 24;
    if (hit) {
      clearTimeout(radarFadeTimer);
      document.body.classList.remove("radar-fade");
      document.body.classList.add("radar-active");
      setTimeout(() => {
        scheduleRadarFade();
      }, 3000);
    }
  });
}

// =============================
// 7) Init & eventos globales
// =============================

window.onload = async function () {
  await cargarItems();
  renderizarItems();

  syncElasticMenuLabels();
  generateCardinalArrows();
  showLastClickedAsTarget(); // radar y target central

  // — móvil/ptr — desactiva pan del navegador SOLO mientras se arrastra sobre el canvas
  const canvas = document.getElementById("canvas");
  if (canvas && window.PointerEvent) {
    const startDrag = () => {
      document.body.classList.add("dragging");
      canvas.style.touchAction = "none";
      canvas.style.overscrollBehavior = "contain";
    };
    const endDrag = () => {
      document.body.classList.remove("dragging");
      canvas.style.touchAction = "";
      canvas.style.overscrollBehavior = "";
    };
    canvas.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  centrarScroll(true); // Scroll inmediato al centro
  setTimeout(() => centrarScroll(false), 350); // Luego animación suave
};

window.addEventListener("resize", () => {
  syncElasticMenuLabels();
  renderizarItems();
  centrarScroll(true);
  setTimeout(() => centrarScroll(false), 300);
});

// Centrado de scroll
function centrarScroll(forceAuto = false) {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  let intentos = 0;
  function intentar() {
    const centerX =
      canvas.offsetLeft + canvas.offsetWidth / 2 - window.innerWidth / 2;
    const centerY =
      canvas.offsetTop + canvas.offsetHeight / 2 - window.innerHeight / 2;

    window.scrollTo({
      left: centerX,
      top: centerY,
      behavior: forceAuto ? "auto" : "smooth",
    });
    intentos++;
    if (intentos < 14) setTimeout(intentar, 130);
  }
  const delay = /Mobi|Android/i.test(navigator.userAgent) ? 250 : 70;
  setTimeout(intentar, delay);
}

// Popup imagen grande
function mostrarPopupGrande(src) {
  let modal = document.getElementById("modal-img-grande");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-img-grande";
    modal.onclick = function (e) {
      if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<img src="${src}" class="popup-img-grande">`;
  modal.style.display = "flex";
}

// — About/Contact reutilizando tu popup —
const ABOUT_TITLE = "Christine Janjira Meyer";
const ABOUT_HTML = `
  <div class="about">
    <p>Designer & illustrator based in Berlin.</p>
    <p><strong>Contact</strong><br>
      <a href="mailto:hello@example.com">hello@example.com</a><br>
      <a href="https://instagram.com/xxxx" target="_blank" rel="noopener">Instagram</a>
    </p>
  </div>
`;

function openAboutPopup() {
  const popup = document.getElementById("popup");
  popup.classList.remove("oculto");
  document.getElementById("popup-titulo").textContent = ABOUT_TITLE;
  document.getElementById("popup-descripcion").innerHTML = ABOUT_HTML;

  const img = document.getElementById("popup-imagen");
  const gal = document.getElementById("popup-galeria");
  if (img) { img.src = ""; img.style.display = "none"; }
  if (gal) { gal.innerHTML = ""; }
}

/* ===== Brand (texto puro arriba-izquierda) ===== */
function syncBrandLabel() {
  const faux = document.querySelector('#brand .brand-faux');
  if (!faux) return;
  const txt = (faux.getAttribute('data-label') || '').toUpperCase();
  fitFauxSVG(faux, txt);
}

window.addEventListener('load', () => {
  syncBrandLabel();
});
window.addEventListener('resize', () => {
  syncBrandLabel();
});

// Abrir popup About al pulsar el brand
document.getElementById('brand')?.addEventListener('click', openAboutPopup);


// Recalcular rótulos cuando la fuente esté lista (evita medir con fallback)
if (document.fonts && document.fonts.load) {
  Promise.all([
    document.fonts.load('900 40px "CooperHewitt-Heavy"'),
    document.fonts.ready
  ]).then(() => {
    syncElasticMenuLabels();
    if (typeof syncBrandLabel === "function") syncBrandLabel();
  });
}
