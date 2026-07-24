# Plan de desarrollo — Viajero App

Itinerario de viajes, web, mobile-first, con vista offline de un viaje activo y datos centralizados compartidos entre 2 personas sin autenticación.

## 1. Objetivo

Una app web simple para planear y consultar itinerarios de viaje:
- Pantalla inicial con tarjetas de todos los viajes.
- Detalle de viaje con 3 pestañas inferiores estilo app móvil: **Principal**, **Actividades**, **Estadía**.
- Datos centralizados en una base de datos compartida (Supabase), sin login: las 2 personas ven y editan lo mismo.
- Un botón flotante (FAB) para descargar una copia offline de **un solo viaje a la vez**.
- Desplegado en GitHub Pages.

## 2. Alcance del MVP

**Incluido:**
- CRUD de viajes: nombre, URL de imagen de portada, fecha/hora de inicio, fecha/hora de fin.
- CRUD de actividades por viaje: descripción, fecha/hora de inicio, fecha/hora de fin. Vista tipo horario/calendario vertical, ordenada cronológicamente.
- CRUD de estadías por viaje: nombre/lugar, checkin y checkout (rango de fechas, puede cubrir varias noches). Vista superior con los días del viaje en verde (cubiertos) o rojo (sin estadía).
- Sincronización manual (botón flotante) que descarga un viaje completo para verlo offline, en modo solo lectura.
- Pantalla inicial navegable offline con metadatos ligeros de todos los viajes (nombre, imagen, fechas).
- PWA instalable.
- Responsive, prioridad mobile.

**Fuera del MVP, pero contemplado en el diseño de datos para no bloquear el futuro:**
- Presupuesto / gastos del viaje.
- Checklist de equipaje.
- Notas generales del viaje.

Estas tres se dejan como **tablas independientes futuras** relacionadas por `trip_id`, no se construyen ahora (evitar sobre-ingeniería), pero el modelo (UUIDs, relaciones simples) permite añadirlas sin romper nada existente.

**Explícitamente fuera de alcance:**
- Autenticación / usuarios / permisos.
- Sincronización en tiempo real o resolución de conflictos.
- Edición offline.
- Subida de imágenes (solo URL externa).
- Internacionalización (solo español).

## 3. Stack tecnológico

| Capa | Elección | Motivo |
|---|---|---|
| Framework | React + Vite + TypeScript | Compila a estático para GitHub Pages, ecosistema maduro, buen soporte PWA. |
| Estilos | Tailwind CSS | Rápido para maquetar UI mobile (tabs, FAB, cards) de forma consistente. |
| Ruteo | React Router (modo estático) | Navegación entre Home / Detalle de viaje / pestañas. |
| Backend de datos | Supabase (Postgres), **sin auth** | Base de datos centralizada real, gratis en el tier necesario para este uso, API REST/JS lista para usar. |
| Cache offline | IndexedDB vía librería `idb` | Estándar del navegador, soporta el modelo de "1 viaje completo + índice liviano". |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest + service worker para instalar la app y cachear assets estáticos. |
| Fechas | `date-fns` (o similar) | Manejo de rangos de fechas, timezones, formateo. |
| Despliegue | GitHub Actions → GitHub Pages | Deploy automático en cada push a `main`, sin pasos manuales. |
| Testing | Ninguno en v1 | Decisión explícita: priorizar velocidad, añadir después si el proyecto crece. |

No se usa gestor de estado global pesado (Redux, etc.) — con hooks de React + un cliente Supabase + el wrapper de IndexedDB es suficiente para el tamaño de esta app.

## 4. Modelo de datos

### 4.1 Supabase (fuente de verdad, Postgres)

```
trips
  id                uuid, pk
  name              text
  cover_image_url   text, nullable
  start_datetime    timestamptz
  end_datetime      timestamptz
  created_at        timestamptz, default now()
  updated_at        timestamptz

activities
  id                uuid, pk
  trip_id           uuid, fk -> trips.id, on delete cascade
  description       text
  start_datetime    timestamptz
  end_datetime      timestamptz
  created_at        timestamptz, default now()
  updated_at        timestamptz

lodgings   (estadías)
  id                uuid, pk
  trip_id           uuid, fk -> trips.id, on delete cascade
  name              text
  checkin_date      date  (o timestamptz si luego se quiere hora exacta)
  checkout_date     date
  notes             text, nullable
  created_at        timestamptz, default now()
  updated_at        timestamptz
```

Sin columnas de usuario/propietario (no hay auth). RLS se deja **habilitado** con una policy explícita "allow all" para el rol `anon`, en vez de desactivar RLS por completo — es una decisión intencional y documentada, no un descuido (ver sección de seguridad).

Tablas futuras (no se crean en el MVP): `budget_items`, `packing_checklist_items`, `trip_notes` — todas con `trip_id` como FK.

### 4.2 Cache local (IndexedDB, vía `idb`)

Dos "stores" únicamente:

```
trips_index        -> lista liviana de TODOS los viajes
  { id, name, cover_image_url, start_datetime, end_datetime, updated_at }

active_trip_cache  -> UN solo registro (clave fija "current")
  {
    trip_id, synced_at,
    trip: {...},
    activities: [...],
    lodgings: [...]
  }
```

Regla dura: al sincronizar un viaje nuevo, `active_trip_cache` se **sobrescribe por completo** (no se acumulan viajes). Esto cumple el requisito de no ocupar mucho espacio local.

## 5. Sincronización y comportamiento offline

Modelo confirmado — simple y de solo lectura offline:

1. **Home (lista de viajes):** si hay internet, se refresca `trips_index` desde Supabase y se guarda en cache; la pantalla siempre se pinta desde `trips_index` (online o no), así offline siempre muestra algo.
2. **Botón flotante "Sincronizar"** (dentro del detalle de un viaje, estilo FAB circular, visible en las 3 pestañas): al presionarlo, descarga el viaje completo (trip + activities + lodgings) desde Supabase y reemplaza `active_trip_cache` entero. Es de **solo descarga** (no sube nada).
3. **Edición:** solo está disponible con conexión a internet activa; los cambios se escriben directo contra Supabase. No hay edición offline ni cola de cambios pendientes.
4. **Modo offline dentro de un viaje:** si el viaje abierto coincide con `active_trip_cache.trip_id`, se muestra en modo lectura con los datos de la última sincronización (mostrar fecha/hora de esa sincronización en la UI). Si es un viaje distinto al cacheado y no hay internet, se muestra un estado de "no disponible sin conexión, sincronízalo primero".
5. Detectar conexión con `navigator.onLine` + listeners `online`/`offline`; deshabilitar formularios de edición cuando esté offline.

## 6. Navegación y pantallas

**Home** — grid/lista de cards responsive (1 columna en celular, más columnas en pantallas anchas), cada card con imagen de fondo, nombre y fechas del viaje. Tap → detalle del viaje.

**Detalle de viaje** — layout con bottom tab bar fija (estilo app móvil, iconos + etiquetas) y FAB de sincronizar flotando sobre la tab bar:

- **Pestaña Principal:** formulario del viaje — nombre, URL de imagen de portada (con preview), fecha/hora de inicio, fecha/hora de fin.
- **Pestaña Actividades:** formulario para agregar actividad (descripción, inicio, fin) + timeline vertical debajo, agrupado por día, ordenado cronológicamente.
- **Pestaña Estadía:** franja superior con los días del viaje (derivados de las fechas del viaje) en verde si un lodging los cubre (checkin ≤ día ≤ checkout) o rojo si no; debajo, lista de estadías registradas + formulario para agregar una nueva (checkin/checkout).

## 7. Seguridad y privacidad (nota importante)

Decisión del proyecto: sin autenticación, datos compartidos abiertamente entre las 2 personas, seguridad/visibilidad no es prioridad. Documentado como riesgo aceptado:

- La app es estática (GitHub Pages) y el cliente de Supabase corre en el navegador → la URL del proyecto y la **anon key pública** quedan visibles en el bundle de JavaScript, sin importar si el repo es público o privado (la página publicada es alcanzable por su URL igualmente).
- Con RLS "allow all", cualquiera que obtenga esa URL+key podría leer/escribir todos los viajes. Se acepta este riesgo explícitamente para este proyecto personal.
- Nunca se usa la `service_role key` (la privada) en el frontend — solo la `anon key` pública, que es la diseñada para exponerse en clientes.
- Recomendación mínima (sin añadir complejidad): no publicitar la URL de la página fuera de las 2 personas que la usan.

## 8. Fases de desarrollo

0. **Setup:** scaffold Vite+React+TS, Tailwind, ESLint/Prettier, estructura de carpetas, proyecto Supabase (tablas + RLS), variables de entorno, workflow de GitHub Actions a Pages, config base de `vite-plugin-pwa`.
1. **Capa de datos:** cliente Supabase, tipos TypeScript de las 3 tablas, funciones CRUD, wrapper de IndexedDB con los 2 stores.
2. **Home:** listado de cards responsive, carga+cache de `trips_index`, estados de carga/offline/vacío.
3. **Shell del detalle de viaje:** ruteo por viaje, bottom tab bar, layout mobile-first.
4. **Pestaña Principal:** crear/editar datos base del viaje.
5. **Pestaña Actividades:** alta de actividades + vista timeline.
6. **Pestaña Estadía:** franja de días coloreados + alta/listado de estadías.
7. **Sincronización offline:** FAB, descarga completa con reemplazo de cache, modo solo lectura offline, indicadores de estado y última sincronización.
8. **PWA:** manifest, íconos, service worker de assets estáticos (Workbox).
9. **Pulido:** validaciones de formularios, manejo de errores, accesibilidad básica, ajustes responsive, pruebas manuales en un celular real.
10. **Despliegue final:** verificación en GitHub Pages, revisión de variables públicas, smoke test en producción.
11. *(Futuro, fuera del MVP)*: presupuesto/gastos, checklist de equipaje, notas generales.

## 9. Despliegue

- Vite `base` configurado según el nombre del repo (`/<repo>/`) para que rutas y assets funcionen en GitHub Pages.
- GitHub Actions: build en cada push a `main` → publica a la rama/entorno de Pages. Sin pasos manuales de por medio.
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` inyectadas en build time (son públicas por diseño, ver sección 7).

## 10. Supuestos registrados

- Bottom tabs se mantienen igual en desktop y mobile (no se cambia a sidebar en pantallas anchas), para mantener consistencia visual simple.
- `checkin_date`/`checkout_date` de estadías se manejan como fecha (sin hora) — si luego se necesita hora exacta de checkin/checkout se puede migrar a `timestamptz` sin romper el resto del modelo.
- Timezone: fechas/horas se guardan en UTC en Supabase y se muestran en la zona horaria local del navegador.
