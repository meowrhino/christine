/* house.js — la forma de la casa (data/site.json y projects/<slug>/project.json)
   → la del items.json de antes, que es la que lee app.js. La usan js/carga.js
   y el build. No toca el disco. El id de cada ítem es el nombre de su
   carpeta, y su imagen, projects/<slug>/1.webp. */

export const slugsOf = (site) => site.lists.projects;

export const toOld = (site, projects) => slugsOf(site).map((slug) => ({
  id: slug,
  titulo: projects[slug].title,
  ejes: projects[slug].axes,
  descripcion: projects[slug].text,
}));
