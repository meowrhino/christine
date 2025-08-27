let itemsData = [];
let ejes = [];
let ejeX = "";
let ejeY = "";

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
    generateCardinalArrows();
  };
  selectY.onchange = function () {
    ejeY = selectY.value;
    if (ejeY === ejeX) {
      ejeX = ejes.find((e) => e !== ejeY);
    }
    renderizarSelectoresEjes();
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

// Programa un "fade-out" suave del radar: quita la animación infinita,
// lanza 1 pulso final y limpia la clase tras ~1.8s (duración+delay).
function scheduleRadarFade() {
  document.body.classList.remove("radar-active");
  document.body.classList.add("radar-fade");
  clearTimeout(radarFadeTimer);
  radarFadeTimer = setTimeout(() => {
    document.body.classList.remove("radar-fade");
  }, 1800); // ≈ var(--radar-duration 1400ms) + var(--radar-delay 400ms)
}

// Ángulo aleatorio en rango [-max,+max]
function randomAngle(max = 15) {
  return Math.random() * (max * 2) - max;
}

// Renderiza los ítems en el canvas posicionándolos según los ejes seleccionados
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

    // Función de posicionamiento (reutilizable tras load)
    function position() {
      const w = div.offsetWidth || img.naturalWidth || 80;
      const h = div.offsetHeight || img.naturalHeight || 80;
      const x = mapToCanvas(item.ejes[ejeX], -12, 12, canvasW) - w / 2;
      const y = mapToCanvas(item.ejes[ejeY], -12, 12, canvasH) - h / 2;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
    }

    // Posición inicial (puede refinarse tras cargar la imagen)
    position();

    // Reposiciona cuando la imagen termina de cargar (mejor centrado)
    if (!img.complete) {
      img.addEventListener("load", position, { once: true });
    }

    // Click para mostrar popup
    div.onclick = (e) => {
      e.stopPropagation();
      mostrarPopup(item);
    };
  });

  // Hover: cada entrada recalcula una rotación nueva (±15º) SIN enderezar,
  // y sube z-index mientras dure el hover.
  canvas.querySelectorAll(".item").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      const base = parseFloat(el.dataset.rotBase || "0");
      const delta = randomAngle(15);
      const target = (base + delta).toFixed(2);
      el.dataset.rotHover = target;
      el.style.zIndex = "999"; // por encima del resto
      el.style.transform = `rotate(${target}deg)`;
    });
    el.addEventListener("mouseleave", () => {
      // Vuelve a la rotación base (no se endereza a 0)
      const base = parseFloat(el.dataset.rotBase || "0").toFixed(2);
      el.style.transform = `rotate(${base}deg)`;
      el.style.zIndex = ""; // restaurar stacking normal
    });
  });
}

// Popup con info detallada del ítem seleccionado
function mostrarPopup(item) {
  const popup = document.getElementById("popup");
  popup.classList.remove("oculto");
  document.getElementById("popup-titulo").textContent = item.titulo;
  document.getElementById("popup-descripcion").innerHTML = (
    item.descripcion || []
  )
    .map((p) => `<p>${p}</p>`)
    .join("");
  const popupImg = document.getElementById("popup-imagen");
  popupImg.src = `img/_items/${item.id}.png`;
  // Fallback por si el archivo con id no existe
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

// Inicializa todo al cargar la ventana
window.onload = async function () {
  await cargarItems();
  renderizarItems();

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
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
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
  const [leftLabel, rightLabel] = String(ejeX).split("/");
  const [topLabel, bottomLabel] = String(ejeY).split("/");

  setSlotImg("slot-left", "left", normalizePole(leftLabel));
  setSlotImg("slot-right", "right", normalizePole(rightLabel));
  setSlotImg("slot-top", "top", normalizePole(topLabel));
  setSlotImg("slot-bottom", "bottom", normalizePole(bottomLabel));
}

// --- Radar y Target Central ---
function showLastClickedAsTarget() {
  // Garantiza que exista #axis-center dentro del canvas
  let c = document.getElementById("axis-center");
  if (!c) {
    c = document.createElement("div");
    c.id = "axis-center";
  }
  const __canvasForCenter = document.getElementById("canvas");
  if (__canvasForCenter && c.parentElement !== __canvasForCenter) {
    __canvasForCenter.appendChild(c);
  }

  // Hover (desktop) con fade-out suave al salir
  c.addEventListener("mouseenter", () => {
    clearTimeout(radarFadeTimer);
    document.body.classList.remove("radar-fade");
    document.body.classList.add("radar-active");
  });
  c.addEventListener("mouseleave", () => {
    scheduleRadarFade();
  });

  // Click / tap directamente sobre el centro (mantiene activo 3s y luego fade)
  c.addEventListener("pointerdown", () => {
    clearTimeout(radarFadeTimer);
    document.body.classList.remove("radar-fade");
    document.body.classList.add("radar-active");
    setTimeout(() => {
      scheduleRadarFade();
    }, 3000);
  });

  // Tap/click cerca del centro también dispara (más fácil en móvil)
  window.addEventListener("pointerdown", (e) => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const hit = Math.max(Math.abs(e.clientX - cx), Math.abs(e.clientY - cy)) <= 24; // tolerancia
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
