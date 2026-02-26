# ZONA CENTRO INMOBILIARIA - Sitio Web

Estructura recomendada para publicar en GitHub Pages.

## Estructura

- `index.html`: página pública
- `admin.html`: panel de administración (login y carga de formularios/inmuebles)
- `assets/css/styles.css`: estilos del sitio
- `assets/js/main.js`: lógica JavaScript
- `paginawen.html`: archivo original (respaldo)

## Publicar en GitHub Pages

1. Sube este proyecto a un repositorio en GitHub.
2. En **Settings > Pages**, selecciona la rama principal (`main`) y carpeta raíz (`/root`).
3. Guarda y espera la URL pública.

## Nota

Este sitio usa recursos externos por CDN (Bootstrap, Font Awesome, Google Fonts y Supabase JS).

La administración depende de autenticación en Supabase. `admin.html` debe compartirse solo con usuarios autorizados.
