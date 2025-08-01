// app.js
let itemsData = [];

async function cargarItems() {
  const respuesta = await fetch('items.json');
  itemsData = await respuesta.json();
  console.log(itemsData); // confirmar carga
  seleccionarEjesAleatorios();
}

function seleccionarEjesAleatorios() {
  const todosEjes = Object.keys(itemsData[0].ejes);
  const ejesElegidos = [];

  while (ejesElegidos.length < 2) {
    const randomIndex = Math.floor(Math.random() * todosEjes.length);
    const eje = todosEjes[randomIndex];
    if (!ejesElegidos.includes(eje)) ejesElegidos.push(eje);
  }

  document.getElementById('eje-x').innerText = ejesElegidos[0];
  document.getElementById('eje-y').innerText = ejesElegidos[1];

  renderizarItems(ejesElegidos[0], ejesElegidos[1]);
}

function mapToCanvas(val, min, max, size) {
  // val: valor del eje (-10 a 10), min=-10, max=10, size = ancho o alto canvas en px
  return ((val - min) / (max - min)) * size;
}

function renderizarItems(ejeX, ejeY) {
  const canvas = document.getElementById('canvas');

  // Elimina ítems previos, pero no los ejes ni el centro
  Array.from(canvas.querySelectorAll('.item')).forEach(el => el.remove());

  const canvasW = canvas.offsetWidth;
  const canvasH = canvas.offsetHeight;

  // Añade un pequeño círculo visual en el centro del canvas para referencia
  let axisCenter = document.getElementById('axis-center');
  if (!axisCenter) {
    axisCenter = document.createElement('div');
    axisCenter.id = 'axis-center';
    // Estilos para el círculo central
    axisCenter.style.position = 'absolute';
    axisCenter.style.width = '10px';
    axisCenter.style.height = '10px';
    axisCenter.style.backgroundColor = 'red';
    axisCenter.style.borderRadius = '50%';
    axisCenter.style.left = `${canvasW / 2 - 5}px`; // centrar círculo (5 = mitad tamaño)
    axisCenter.style.top = `${canvasH / 2 - 5}px`;
    canvas.appendChild(axisCenter);
  } else {
    // Actualiza posición en caso de cambio de tamaño
    axisCenter.style.left = `${canvasW / 2 - 5}px`;
    axisCenter.style.top = `${canvasH / 2 - 5}px`;
  }

  itemsData.forEach(item => {
    // Crear contenedor principal del ítem
    const div = document.createElement('div');
    div.className = 'item';
    div.title = item.titulo;

    // Mapea los valores de -10 a 10 en posición real dentro del canvas
    // Restamos 40 para centrar el cuadrado (asumiendo tamaño 80x80)
    const x = mapToCanvas(item.ejes[ejeX], -10, 10, canvasW) - 40;
    const y = mapToCanvas(item.ejes[ejeY], -10, 10, canvasH) - 40;

    // Posiciona el contenedor en el canvas
    div.style.position = 'absolute';
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.style.width = '80px';
    div.style.height = '80px';
    div.style.boxSizing = 'border-box';
    div.dataset.id = item.id ?? item.titulo;

    if (item.miniatura) {
      const img = document.createElement('img');
      img.src = item.miniatura;
      img.alt = '';
      div.appendChild(img);
    } else {
      // Letra inicial, bien grande
      const inicial = document.createElement('div');
      inicial.className = 'item-inicial';
      inicial.textContent = item.titulo[0].toUpperCase();
      div.appendChild(inicial);
    }

    // Añadir el contenedor del ítem al canvas
    canvas.appendChild(div);

    // Crear un div para mostrar el título completo debajo del recuadro
    const tituloDiv = document.createElement('div');
    tituloDiv.className = 'item-titulo';
    tituloDiv.textContent = item.titulo;
    tituloDiv.style.position = 'absolute';
    tituloDiv.style.left = `${x}px`;
    // Posición justo debajo del recuadro (80px altura del ítem + 4px margen)
    tituloDiv.style.top = `${y + 80 + 4}px`;
    tituloDiv.style.width = '80px';
    tituloDiv.style.textAlign = 'center';
    tituloDiv.style.fontSize = '12px';
    tituloDiv.style.color = '#333';
    tituloDiv.style.pointerEvents = 'none'; // para que no interfiera con eventos

    canvas.appendChild(tituloDiv);
  });
}

// Inicializar al cargar la página
window.onload = async function() {
  // Cargar items y renderizar ejes e ítems
  await cargarItems();

  // Una vez renderizado el canvas, centra el scroll en el medio del canvas
  const canvas = document.getElementById('canvas');
  if (canvas) {
    // Esperar un frame para asegurar que el DOM está actualizado
    requestAnimationFrame(() => {
      window.scrollTo(
        canvas.offsetWidth / 2 - window.innerWidth / 2,
        canvas.offsetHeight / 2 - window.innerHeight / 2
      );
    });
  }
};