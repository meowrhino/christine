/* carga.js — lee data/site.json y projects/<slug>/project.json y los pasa a
   la forma del items.json de antes (js/house.js). Script clásico: deja
   window.CASA para app.js.

   Las páginas que escribe el build llevan data-built en <html>. Sin él es la
   vista previa (Live Server, sin build): cada JSON se revisa con su esquema
   (schema/) como hace el build, y lo que esté mal sale en pantalla. */
(function () {
  const BUILT = document.documentElement.hasAttribute('data-built');
  const ROOT = new URL('.', document.baseURI).href;
  const cache = new Map();

  function get(path) {
    if (!cache.has(path)) {
      cache.set(path, fetch(ROOT + path, { cache: BUILT ? 'default' : 'no-store' }).then(async (res) => {
        if (!res.ok) throw new Error(`no encuentro ${path}`);
        const { leerJSON } = await import(ROOT + 'js/validar.js');
        try { return leerJSON(await res.text(), path); } catch (e) { showErrors([e.message]); throw e; }
      }));
    }
    return cache.get(path);
  }

  function showErrors(errors) {
    let box = document.getElementById('errores-vista-previa');
    if (!box) {
      box = document.createElement('pre');
      box.id = 'errores-vista-previa';
      box.style.cssText = 'position:fixed;inset:0;z-index:99999;margin:0;padding:2rem;overflow:auto;white-space:pre-wrap;'
        + 'background:#000;color:#fff;font:15px/1.5 monospace;';
      box.textContent = 'esto no se publicaría:\n\n';
      document.body.append(box);
    }
    box.textContent += errors.map((e) => `✗ ${e}`).join('\n') + '\n\narréglalo, guarda, y la página se recarga sola.\n';
  }

  async function loadData() {
    const { toOld, slugsOf } = await import(ROOT + 'js/house.js');
    const site = await get('data/site.json');
    const slugs = slugsOf(site);
    const projects = Object.fromEntries(await Promise.all(slugs.map(async (s) => [s, await get(`projects/${s}/project.json`)])));
    if (!BUILT) {
      const { validar } = await import(ROOT + 'js/validar.js');
      const schema = Object.fromEntries(await Promise.all(['site', 'project'].map(async (t) => [t, await get(`schema/${t}.json`)])));
      const errors = [
        ...validar(site, schema.site, 'data/site.json'),
        ...slugs.flatMap((s) => validar(projects[s], schema.project, `projects/${s}/project.json`)),
      ];
      if (errors.length) { showErrors(errors); throw new Error(errors.join('\n')); }
    }
    return toOld(site, projects);
  }

  window.CASA = { BUILT, loadData, showErrors };
})();
