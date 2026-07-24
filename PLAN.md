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

| Capa             | Elección                          | Motivo                                                                                                   |
| ---------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Framework        | React + Vite + TypeScript         | Compila a estático para GitHub Pages, ecosistema maduro, buen soporte PWA.                               |
| Estilos          | Tailwind CSS                      | Rápido para maquetar UI mobile (tabs, FAB, cards) de forma consistente.                                  |
| Ruteo            | React Router (modo estático)      | Navegación entre Home / Detalle de viaje / pestañas.                                                     |
| Iconografía      | `lucide-react`                    | Pack de iconos gratuito (MIT), tree-shakeable, estética minimalista consistente con Tailwind.            |
| Backend de datos | Supabase (Postgres), **sin auth** | Base de datos centralizada real, gratis en el tier necesario para este uso, API REST/JS lista para usar. |
| Cache offline    | IndexedDB vía librería `idb`      | Estándar del navegador, soporta el modelo de "1 viaje completo + índice liviano".                        |
| PWA              | `vite-plugin-pwa` (Workbox)       | Manifest + service worker para instalar la app y cachear assets estáticos.                               |
| Fechas           | `date-fns` (o similar)            | Manejo de rangos de fechas, timezones, formateo.                                                         |
| Despliegue       | GitHub Actions → GitHub Pages     | Deploy automático en cada push a `main`, sin pasos manuales.                                             |
| Testing          | Ninguno en v1                     | Decisión explícita: priorizar velocidad, añadir después si el proyecto crece.                            |

No se usa gestor de estado global pesado (Redux, etc.) — con hooks de React + un cliente Supabase + el wrapper de IndexedDB es suficiente para el tamaño de esta app.

### 3.1 Política de capa gratuita

Todo el stack se elige para operar dentro de niveles gratuitos, sin tarjeta de crédito ni upgrades pagos:

- **Supabase (plan Free):** 500MB de base de datos, 1GB de almacenamiento, 5GB de transferencia/mes — de sobra para 2 personas y datos que son solo texto (no se suben imágenes, solo URLs).
- **GitHub Pages + GitHub Actions:** gratis para repos públicos (`kfervera/viajero-app` es público) — sin límite de minutos de Actions ni de banda ancha de Pages en repos públicos.
- **Librerías npm:** todas de código abierto con licencia permisiva (MIT/ISC) — React, Vite, Tailwind, React Router, `idb`, `vite-plugin-pwa`, `date-fns` y el pack de iconos elegido.
- No se introduce ningún servicio o librería de pago sin confirmarlo antes contigo. Si algún límite del tier gratuito llega a ser un problema real (poco probable con 2 usuarios), se evalúa en ese momento — no se sobre-diseña para una escala que no existe.

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

**Detalle de viaje** — header fijo arriba con ícono de grilla (4 cuadrados, vuelve al Home/lista de viajes) + nombre del viaje, bottom tab bar fija debajo del contenido (estilo app móvil, iconos del pack elegido en §3 + etiquetas) y FAB de sincronizar flotando sobre la tab bar. **Actividades es la pestaña por defecto**: tanto al crear un viaje nuevo como al entrar a uno existente desde el Home, se aterriza en Actividades (no en Principal).

- **Pestaña Principal:** formulario del viaje — nombre, URL de imagen de portada (con preview), fecha/hora de inicio, fecha/hora de fin. Ícono sugerido: casa/mapa. Al crear un viaje nuevo (`/viajes/nuevo`), incluye un botón "Cancelar" junto al de guardar que vuelve al Home sin crear nada; ese botón no aparece al editar un viaje ya existente.
- **Pestaña Actividades:** formulario para agregar actividad (descripción, inicio, fin) + timeline vertical debajo, agrupado por día, ordenado cronológicamente. Ícono sugerido: calendario/lista.
- **Pestaña Estadía:** franja superior con los días del viaje (derivados de las fechas del viaje) en verde si un lodging los cubre (checkin ≤ día ≤ checkout) o rojo si no; debajo, lista de estadías registradas + formulario para agregar una nueva (checkin/checkout). Ícono sugerido: cama/edificio.
- **FAB de sincronizar:** ícono de "descargar"/"refrescar" del mismo pack.

## 7. Seguridad y privacidad (nota importante)

Decisión del proyecto: sin autenticación, datos compartidos abiertamente entre las 2 personas, seguridad/visibilidad no es prioridad. Documentado como riesgo aceptado:

- La app es estática (GitHub Pages) y el cliente de Supabase corre en el navegador → la URL del proyecto y la **anon key pública** quedan visibles en el bundle de JavaScript, sin importar si el repo es público o privado (la página publicada es alcanzable por su URL igualmente).
- Con RLS "allow all", cualquiera que obtenga esa URL+key podría leer/escribir todos los viajes. Se acepta este riesgo explícitamente para este proyecto personal.
- Nunca se usa la `service_role key` (la privada) en el frontend — solo la `anon key` pública, que es la diseñada para exponerse en clientes.
- Recomendación mínima (sin añadir complejidad): no publicitar la URL de la página fuera de las 2 personas que la usan.

## 8. Flujo de trabajo con el agente

El progreso se rastrea con el checklist de la sección 9, usando dos marcas:

- 🤖 **Agente:** el agente lo ejecuta de forma autónoma, sin esperar nada de la persona.
- ⏸ **Pausa:** requiere una acción de la persona (crear un recurso externo, dar credenciales, revisar visualmente, probar en un dispositivo real, etc.) antes de poder continuar.

Al llegar a un ítem ⏸, el agente se detiene, explica con claridad qué hay que hacer y por qué no lo puede hacer él mismo, deja commiteado y pusheado el avance hasta ese punto, y espera una confirmación explícita (ej. "listo", "continúa") para retomar el checklist. Reglas detalladas de commit/push están en el skill `viajero-dev` (`.claude/skills/viajero-dev/SKILL.md`).

## 9. Checklist de seguimiento

Leyenda: 🤖 = lo hace el agente · ⏸ = pausa, acción de la persona.

### Fase 0 — Setup

- [x] 🤖 Scaffold del proyecto (Vite + React + TS)
- [x] 🤖 Configurar Tailwind CSS
- [x] 🤖 Configurar ESLint + Prettier
- [x] 🤖 Crear estructura de carpetas (`src/lib`, `src/data`, `src/hooks`, `src/components`, `src/routes`)
- [x] 🤖 Instalar `lucide-react`
- [ ] ⏸ Crear cuenta en Supabase (si no existe) y generar un token de acceso (Personal Access Token o sesión de `supabase login` vía CLI); compartirlo con el agente
- [x] 🤖 Crear el proyecto en Supabase, las tablas (`trips`, `activities`, `lodgings`) y las políticas RLS "allow all" para `anon` (vía Supabase CLI/Management API)
- [x] 🤖 Obtener la URL y anon key del proyecto creado; crear `.env` local (no versionado) y `.env.example`
- [x] ⏸ Configurar los secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub (Settings → Secrets and variables → Actions)
- [x] 🤖 Crear workflow de GitHub Actions (build + deploy a Pages)
- [x] ⏸ Habilitar GitHub Pages en Settings → Pages (Source: GitHub Actions)
- [x] 🤖 Configuración base de `vite-plugin-pwa`

### Fase 1 — Capa de datos

- [x] 🤖 Cliente Supabase (`lib/supabase.ts`)
- [x] 🤖 Tipos TS de Trip/Activity/Lodging
- [x] 🤖 Funciones CRUD (`data/trips.ts`, `data/activities.ts`, `data/lodgings.ts`)
- [x] 🤖 Wrapper de IndexedDB (`lib/idb.ts`)

### Fase 2 — Home

- [x] 🤖 Listado de cards responsive + estados de carga/offline/vacío
- [ ] ⏸ Revisar visualmente el Home y dar feedback de diseño

### Fase 3 — Shell del detalle de viaje

- [x] 🤖 Ruteo por viaje, bottom tab bar, layout mobile-first

### Fase 4 — Pestaña Principal

- [x] 🤖 Formulario crear/editar datos base del viaje
- [ ] ⏸ Revisar y dar feedback

### Fase 5 — Pestaña Actividades

- [ ] 🤖 Alta de actividades + vista timeline
- [ ] ⏸ Revisar y dar feedback

### Fase 6 — Pestaña Estadía

- [ ] 🤖 Franja de días coloreados + alta/listado de estadías
- [ ] ⏸ Revisar y dar feedback

### Fase 7 — Sincronización offline

- [ ] 🤖 FAB de sincronizar, descarga completa con reemplazo de cache, indicadores de estado
- [ ] ⏸ Probar el flujo offline en un celular real (modo avión + navegar)

### Fase 8 — PWA

- [ ] 🤖 Manifest, íconos (192/512/maskable), service worker de assets
- [ ] ⏸ Probar instalación de la PWA en un celular real

### Fase 9 — Pulido

- [ ] 🤖 Validaciones de formularios, manejo de errores, accesibilidad básica, ajustes responsive
- [ ] ⏸ Prueba manual completa en un celular real

### Fase 10 — Despliegue final

- [ ] 🤖 Push a `main` (dispara el deploy automático)
- [ ] ⏸ Verificar la app en la URL pública de GitHub Pages (smoke test)

### Fase 11 — Futuro (fuera del MVP)

- [ ] Presupuesto/gastos, checklist de equipaje, notas generales — no se agenda todavía

## 10. Despliegue

- Vite `base` configurado según el nombre del repo (`/<repo>/`) para que rutas y assets funcionen en GitHub Pages.
- GitHub Actions: build en cada push a `main` → publica a la rama/entorno de Pages. Sin pasos manuales de por medio (salvo habilitar Pages una vez, ver checklist).
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` inyectadas en build time (son públicas por diseño, ver sección 7).

## 11. Supuestos registrados

- Bottom tabs se mantienen igual en desktop y mobile (no se cambia a sidebar en pantallas anchas), para mantener consistencia visual simple.
- `checkin_date`/`checkout_date` de estadías se manejan como fecha (sin hora) — si luego se necesita hora exacta de checkin/checkout se puede migrar a `timestamptz` sin romper el resto del modelo.
- Timezone: fechas/horas se guardan en UTC en Supabase y se muestran en la zona horaria local del navegador.
- Ruteo con `HashRouter` (URLs tipo `#/viajes/:id`) en vez de `BrowserRouter`, porque GitHub Pages no soporta reescritura de rutas del lado del servidor; evita el hack de un `404.html` de redirección.

## 12. Diseño visual (confirmado)

- **Fondo base:** gris cálido tipo "humo" (ej. Tailwind `stone-100`/`neutral-100`), claro pero no blanco puro — evita el look plano de blanco/gris frío.
- **Color de iconos por grupo funcional:** los iconos de un mismo grupo comparten tono; grupos distintos usan colores distintos entre sí, para que cada sección se sienta identificable de un vistazo:
  - Navegación/acciones genéricas (bottom tab bar inactiva, botones secundarios) → un tono neutro (ej. `slate-500`).
  - Iconos de la pestaña Principal (datos del viaje) → un tono (ej. `sky-600`).
  - Iconos de la pestaña Actividades → otro tono (ej. `teal-600`).
  - Iconos de la pestaña Estadía → otro tono distinto de verde/rojo, que ya están reservados por el semáforo de días (§6) (ej. `indigo-600`).
  - FAB de sincronizar → acento cálido (`amber-500`) para que resalte sobre el resto de la UI.
  - Dentro de cada grupo no se mezclan variantes de color — todos los iconos de esa sección usan exactamente el mismo tono.
- **Modo oscuro:** no incluido en el MVP.
- **Tipografía:** fuente del sistema (`font-sans` por defecto de Tailwind), sin depender de Google Fonts externas — mejor para offline/PWA, sin flash de fuente sin cargar.
- **Tarjetas/componentes:** esquinas redondeadas medianas (`rounded-xl`), sombra suave (`shadow-sm`/`shadow-md`), sin bordes duros — estética simple de app móvil.
- **Ícono de la app (PWA/favicon):** un ícono cuadrado simple generado a partir de un ícono de Lucide (ej. maleta o pin de mapa) sobre el color primario, sin diseñar un logo custom.

## 13. Decisiones confirmadas y pendientes

**Confirmado:**

- Pack de iconos: `lucide-react`.
- Automatización de Supabase: se le da al agente un token de acceso (Supabase CLI/Management API) para crear el proyecto, las tablas y las políticas RLS de forma autónoma (🤖, ver checklist §9).
- Flujo de git: push directo a `main` en cada avance (el deploy se dispara automáticamente en cada push).
- Diseño visual: fondo "humo" claro, sin modo oscuro en el MVP, iconos agrupados por color según sección funcional (ver §12).
- Estado vacío del Home (sin viajes creados): mensaje + botón "Crear viaje" (tono `sky-600`).
- Imagen de portada rota o ausente: se usa `background-image` en la card en vez de `<img>`, así se ve el color de fondo plano sin ícono ni hueco roto, tanto si no hay URL como si la URL falla.
- Header del detalle de viaje: barra compartida arriba de las 3 pestañas con ícono de grilla (`lucide-react` `LayoutGrid`, vuelve al Home) + nombre del viaje; se sacaron los títulos duplicados que tenía cada pestaña por separado.
- Pestaña por defecto al entrar/crear un viaje: Actividades (no Principal).
- Botón "Cancelar" en el formulario de viaje nuevo, junto al de guardar, solo cuando es un viaje nuevo (no aparece al editar uno existente).

**Pendiente:**

- Detalles de UX: ¿se pide confirmación antes de borrar un viaje/actividad/estadía?
