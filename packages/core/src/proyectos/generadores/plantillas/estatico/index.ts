/** Archivos de la plantilla interna de un sitio estático. */
const html = (t: string): string => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function archivosEstatico(o: { nombre: string }): Record<string, string> {
  const nombre = html(o.nombre);
  return {
    'index.html': [
      '<!doctype html>',
      '<html lang="es">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      `  <title>${nombre}</title>`,
      '  <link rel="stylesheet" href="estilos.css">',
      '</head>',
      '<body>',
      `  <h1>${nombre}</h1>`,
      '  <p>Sitio estático creado con WolfCore Dev. Edite index.html para empezar.</p>',
      '</body>',
      '</html>',
      '',
    ].join('\n'),
    'estilos.css': [
      'body {',
      '  font-family: system-ui, sans-serif;',
      '  margin: 3rem auto;',
      '  max-width: 40rem;',
      '  padding: 0 1rem;',
      '}',
      '',
    ].join('\n'),
  };
}
