# Guía de la web

> **Regla de oro: solo se tocan `data/site.json` y `projects/`.** Lo demás es el código.

## Qué hay

```
data/site.json             el nombre de la web y qué proyectos salen en el lienzo
projects/<nombre>/         un proyecto, una carpeta:
  project.json               su título, dónde cae en cada eje y el texto del popup
  1.webp                     su imagen
```

## La primera vez: preparar VS Code

1. En VS Code: **Archivo → Nueva ventana** → **Clonar repositorio Git…** → **Clonar desde GitHub**.
2. Instala **Live Server** cuando VS Code lo proponga. Abajo a la derecha sale **Go Live**: es la
   vista previa, y si algo está mal lo dice en pantalla.

**VS Code te ayuda con los campos**: si pasas el ratón por encima de uno te dice qué es, y si
escribes uno mal lo subraya en rojo. Lo sabe por la primera línea de cada JSON (`"$schema": …`):
**no la borres**.

## Añadir un proyecto

1. **Copia una carpeta** de `projects/` y ponle el nombre nuevo (minúsculas, sin acentos, con
   guiones).
2. **La imagen**: pásala por [imgToWeb](https://meowrhino.github.io/imgToWeb/) (en Chrome o
   Firefox) y déjala como `1.webp`.
3. **En `project.json`**: `title`, `text` (un párrafo por línea) y `axes`: dónde cae en cada uno
   de los cuatro ejes, de -12 a 12. Todos los proyectos llevan los mismos ejes.
4. **En `data/site.json`**, en `lists` → `projects`, añade el nombre de la carpeta.
5. **Go Live** para verlo, y después Confirmar → Sincronizar.

## Si sale en rojo

La web no se rompe: se queda como estaba hasta que se arregla. El mensaje dice el fichero y qué
pasa:

- **"no es un JSON válido, línea 12"** → casi siempre **una coma** de más o de menos, o unas
  comillas sin cerrar.
- **"\"titel\" no es un campo de aquí (¿mal escrito?)"** → un campo mal escrito.
- **"falta projects/nuevo/1.webp"** → la imagen no se llama así o no está.
- **"\"axes\" tiene que llevar los mismos ejes que los demás"** → falta un eje o está escrito
  distinto.
