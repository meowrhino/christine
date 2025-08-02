let itemsData = [];
let ejes = [];
let ejeX = "";
let ejeY = "";

// Carga los ítems y ejes, y pinta el canvas
async function cargarItems() {
  const respuesta = await fetch('items.json');
  itemsData = await respuesta.json();
  ejes = Object.keys(itemsData[0].ejes);

  // Selecciona ejes aleatorios distintos
  seleccionarEjesAleatorios();

  // Renderiza los selectores con las opciones válidas
  renderizarSelectoresEjes();
}

// Renderiza los selectores de ejes evitando duplicados
function renderizarSelectoresEjes() {
  const selectX = document.getElementById('eje-x');
  const selectY = document.getElementById('eje-y');

  // Guardar valor actual
  const currentX = ejeX;
  const currentY = ejeY;

  // Eje X
  selectX.innerHTML = "";
  ejes.forEach(eje => {
    if (eje !== ejeY) {
      let optX = document.createElement('option');
      optX.value = eje;
      optX.textContent = eje;
      if (eje === ejeX) optX.selected = true;
      selectX.appendChild(optX);
    }
  });
  // Eje Y
  selectY.innerHTML = "";
  ejes.forEach(eje => {
    if (eje !== ejeX) {
      let optY = document.createElement('option');
      optY.value = eje;
      optY.textContent = eje;
      if (eje === ejeY) optY.selected = true;
      selectY.appendChild(optY);
    }
  });

  // Listeners
  selectX.onchange = function () {
    ejeX = selectX.value;
    if (ejeX === ejeY) { // Auto-cambia eje Y si colisiona
      ejeY = ejes.find(e => e !== ejeX);
    }
    renderizarSelectoresEjes();
    renderizarItems();
  };
  selectY.onchange = function () {
    ejeY = selectY.value;
    if (ejeY === ejeX) {
      ejeX = ejes.find(e => e !== ejeY);
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

function mapToCanvas(val, min, max, size) {
  return ((val - min) / (max - min)) * size;
}

function renderizarItems() {
  const canvas = document.getElementById('canvas');
  Array.from(canvas.querySelectorAll('.item')).forEach(el => el.remove());

  const canvasW = canvas.offsetWidth;
  const canvasH = canvas.offsetHeight;

  // Centra el círculo central siempre
  let axisCenter = document.getElementById('axis-center');
  if (!axisCenter) {
    axisCenter = document.createElement('div');
    axisCenter.id = 'axis-center';
    canvas.appendChild(axisCenter);
  }
  axisCenter.style.left = `calc(50% - 5px)`;
  axisCenter.style.top = `calc(50% - 5px)`;

  itemsData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.id = item.id ?? item.titulo;

    const x = mapToCanvas(item.ejes[ejeX], -10, 10, canvasW) - 40;
    const y = mapToCanvas(item.ejes[ejeY], -10, 10, canvasH) - 40;

    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // Imagen o inicial
    if (item.miniatura) {
      const img = document.createElement('img');
      img.src = item.miniatura;
      img.alt = '';
      div.appendChild(img);
    } else {
      const inicial = document.createElement('div');
      inicial.className = 'item-inicial';
      inicial.textContent = item.titulo[0].toUpperCase();
      div.appendChild(inicial);
    }

    // Título debajo
    const tituloDiv = document.createElement('div');
    tituloDiv.className = 'item-titulo';
    tituloDiv.textContent = item.titulo;
    div.appendChild(tituloDiv);

    // Click en cuadrado o título = popup
    div.onclick = (e) => {
      e.stopPropagation();
      mostrarPopup(item);
    };

    canvas.appendChild(div);
  });
}

// Popup con info
function mostrarPopup(item) {
  const popup = document.getElementById('popup');
  popup.classList.remove('oculto');
  document.getElementById('popup-titulo').textContent = item.titulo;
  document.getElementById('popup-descripcion').innerHTML = (item.descripcion || []).map(p => `<p>${p}</p>`).join("");
  document.getElementById('popup-imagen').src = item.imagen || item.miniatura || '';
  document.getElementById('popup-galeria').innerHTML = (item.galeria || []).map(src =>
    src.match(/\.(mp4)$/i)
      ? `<video src="${src}" controls style="max-width:120px;max-height:120px;"></video>`
      : `<img src="${src}" style="max-width:120px;max-height:120px;">`
  ).join('');
}

// Cerrar popup
document.getElementById('cerrar-popup').onclick = (e) => {
  document.getElementById('popup').classList.add('oculto');
};
// Click fuera del popup: cierra también
document.getElementById('popup').onclick = (e) => {
  if (e.target === document.getElementById('popup')) {
    document.getElementById('popup').classList.add('oculto');
  }
};

// Inicializa todo
window.onload = async function () {
  await cargarItems();
  renderizarItems();
  // Centra el viewport
  const canvas = document.getElementById('canvas');
  requestAnimationFrame(() => {
    window.scrollTo(
      canvas.offsetWidth / 2 - window.innerWidth / 2,
      canvas.offsetHeight / 2 - window.innerHeight / 2
    );
  });
};