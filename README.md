# GruposMexico - Deploy en Hostinger (Node.js App)

Este proyecto usa React + Vite en frontend y un `server.js` de Node para servir la carpeta `dist` con fallback SPA.

## Requisitos

- Node.js 18.18+ (recomendado Node 20+)
- npm

## Variables de entorno

Configura estas variables antes de hacer build:

```env
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
```

Opcional si publicas bajo subcarpeta:

```env
VITE_BASE_PATH=/mi-subcarpeta/
APP_BASE_PATH=/mi-subcarpeta/
```

`PORT` la asigna Hostinger automáticamente para la app Node.
Si usas subcarpeta, define ambos valores iguales.

## Desarrollo local

```sh
npm install
npm run dev
```

## Producción local (modo Node)

```sh
npm run build
npm start
```

La app queda disponible en `http://localhost:3000` (o el `PORT` configurado).

## Deploy en Hostinger Node.js App

1. Crea una aplicación en la sección **Node.js** de Hostinger.
2. Selecciona Node.js 20+.
3. Sube este proyecto completo (no solo `dist`) al directorio de la app.
4. En variables de entorno del panel, agrega las `VITE_*` de arriba.
5. En terminal de Hostinger ejecuta:

```sh
npm install
npm run build
```

6. Configura inicio de aplicación con:
   - Startup file: `server.js`
   - Start command: `npm start` (si el panel lo solicita)
7. Reinicia la app desde el panel.

## Notas

- Si cambias código frontend, vuelve a correr `npm run build` y reinicia.
- La ruta `/health` responde `{"ok":true}` para validación rápida.
- Si quieres despliegue estático clásico, puedes seguir usando `dist/` + `.htaccess` en `public_html`.
