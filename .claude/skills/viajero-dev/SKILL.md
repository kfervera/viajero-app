---
name: viajero-dev
description: Guía de arquitectura y buenas prácticas para desarrollar Viajero App (itinerario de viajes, React + Vite + TypeScript + Tailwind + Supabase + IndexedDB + PWA, desplegada en GitHub Pages). Úsala siempre que se implemente o modifique código de este proyecto.
---

# Viajero App — guía de desarrollo

Ver `PLAN.md` en la raíz del repo para el plan completo (alcance, modelo de datos, fases). Esta guía cubre **cómo** construir cada pieza siguiendo buenas prácticas y las decisiones ya tomadas del proyecto.

## Stack fijo (no cambiar sin confirmar con el usuario)

- React + Vite + TypeScript (strict mode).
- Tailwind CSS para estilos, mobile-first.
- React Router para navegación.
- Supabase (`@supabase/supabase-js`) como única fuente de verdad de datos, **sin autenticación**.
- `idb` para la cache local en IndexedDB.
- `vite-plugin-pwa` para manifest + service worker.
- `date-fns` (o equivalente) para manejo de fechas.
- `lucide-react` para toda la iconografía — pack gratuito/MIT, nunca un set de pago.
- Sin gestor de estado global (Redux/Zustand/etc.) — hooks de React + contexto ligero es suficiente para el tamaño de esta app. No lo introduzcas salvo que el usuario lo pida.
- Sin framework de testing en v1 — no añadas tests salvo que el usuario lo pida explícitamente.
- Toda dependencia o servicio nuevo debe caber en un nivel gratuito (ver `PLAN.md` §3.1) — no agregues nada de pago sin confirmarlo antes con el usuario.

## Estructura de carpetas esperada

```
src/
  lib/
    supabase.ts        # cliente único de Supabase
    idb.ts              # wrapper de IndexedDB (stores: trips_index, active_trip_cache)
    types.ts            # tipos TS de Trip, Activity, Lodging
  data/
    trips.ts            # funciones CRUD de viajes contra Supabase
    activities.ts        # funciones CRUD de actividades
    lodgings.ts          # funciones CRUD de estadías
  hooks/
    useOnlineStatus.ts
    useTrips.ts           # lee trips_index / Supabase según conexión
    useActiveTrip.ts       # lee active_trip_cache / Supabase según conexión y sync
  components/
    TripCard.tsx
    BottomTabBar.tsx
    SyncFab.tsx
    ActivityTimeline.tsx
    StayDaysStrip.tsx
    ...
  routes/
    Home.tsx
    TripDetail/ (con sub-rutas Principal / Actividades / Estadia)
```

No crear capas ni carpetas adicionales "por si acaso" — mantener el árbol mínimo necesario para el alcance del MVP descrito en `PLAN.md`.

## Convenciones de código

- Componentes funcionales con TypeScript, props tipadas explícitamente (nada de `any`).
- Un componente por archivo, nombre de archivo = nombre del componente.
- Lógica de red/datos vive en `src/data/*` y `src/lib/*`, nunca directamente en componentes de UI — los componentes llaman hooks, los hooks llaman a `data/`.
- Nombres de variables, funciones y tipos en inglés (convención estándar de código); copy visible al usuario en español (única idioma soportado, ver `PLAN.md`).
- Comentarios solo cuando expliquen un porqué no obvio (ej. por qué se sobrescribe todo el cache en sync); nunca comentarios que repitan lo que el código ya dice.

## Capa de datos: Supabase

- Si el usuario provee un token de acceso a Supabase (Personal Access Token o sesión de `supabase login` vía CLI), úsalo para crear el proyecto, las tablas y las políticas RLS de forma autónoma (vía Supabase CLI/Management API) — ver checklist en `PLAN.md` §9. Si no hay token disponible, prepara el SQL y pide a la persona que lo ejecute manualmente en el SQL Editor del dashboard.
- Cliente único en `lib/supabase.ts`, inicializado con `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- **Nunca** uses la `service_role key` en el frontend — solo la `anon key` pública (ver sección de seguridad en `PLAN.md`).
- RLS en Supabase debe quedar habilitado con policies explícitas "allow all" para `anon`, no deshabilitado — es una decisión intencional del proyecto, mantenla así al tocar el esquema.
- Todas las escrituras (crear/editar/borrar trip, activity, lodging) van directo a Supabase y **requieren estar online**; antes de mutar, valida `navigator.onLine` y deshabilita la UI de edición si está offline.
- Al hacer un `update`, refresca también `updated_at`.

## Capa de cache: IndexedDB

Dos stores únicamente, definidos en `lib/idb.ts` (ver esquema completo en `PLAN.md` sección 4.2):

- `trips_index`: metadatos ligeros de todos los viajes, se refresca desde Supabase cuando hay conexión y el Home se monta. Es lo que pinta el Home offline.
- `active_trip_cache`: un único registro con clave fija (`"current"`) que contiene el viaje completo + sus actividades + estadías. **Regla dura: nunca acumules más de un viaje aquí.** Al sincronizar, borra y reescribe completo, no hagas merge parcial.

No uses IndexedDB para nada más (no lo conviertas en una cola de cambios offline, no hay edición offline en este proyecto).

## Reglas de sincronización y modo offline

- El FAB de sincronizar es de **solo descarga** (pull), nunca sube cambios. No implementes lógica de "push" ni de resolución de conflictos — no aplica a este proyecto.
- Detecta conexión con `navigator.onLine` + listeners de `online`/`offline` en un hook (`useOnlineStatus`), y úsalo para: deshabilitar formularios de edición, decidir si el Home/Detalle leen de Supabase o de la cache local.
- Si el usuario abre un viaje que no es el que está en `active_trip_cache` y no hay conexión, muestra un estado claro ("Sin conexión. Sincroniza este viaje cuando tengas internet.") en vez de una pantalla vacía o un error.
- Muestra siempre la fecha/hora de la última sincronización cuando se está viendo un viaje desde cache.

## PWA

- `vite-plugin-pwa` solo debe cachear **assets estáticos** de la app (JS/CSS/imágenes del build, manifest, íconos) vía Workbox. No uses el service worker para cachear respuestas de la API de Supabase — eso ya lo resuelve la capa de IndexedDB descrita arriba; mezclar ambas estrategias genera inconsistencias difíciles de depurar.
- Manifest con íconos en los tamaños estándar (192, 512, maskable), `display: standalone`, `theme_color`/`background_color` coherentes con la paleta Tailwind del proyecto.

## UI mobile-first

- Fondo base en un gris cálido tipo "humo" (`stone-100`/`neutral-100` de Tailwind), nunca blanco puro (`white`) ni gris frío por defecto.
- Color de iconos (Lucide) agrupado por sección funcional, no por icono individual — ver detalle y valores sugeridos en `PLAN.md` §12: un tono para navegación/acciones genéricas, un tono distinto por cada pestaña (Principal/Actividades/Estadía), y el acento cálido reservado para el FAB de sincronizar. Dentro de una misma sección todos los iconos usan el mismo tono; no mezcles variantes de color dentro de un grupo.
- Diseña primero para viewport de celular, luego adapta con breakpoints de Tailwind (`sm:`, `md:`, etc.) para pantallas más anchas.
- Bottom tab bar fija (`position: fixed` al fondo) dentro del detalle de un viaje, con 3 ítems: Principal, Actividades, Estadía — icono + etiqueta, estado activo visualmente distinto.
- FAB de sincronizar: botón circular flotante, no debe tapar ni ser tapado por la bottom tab bar; posición típica: esquina inferior derecha, con margen suficiente sobre la tab bar.
- El timeline de actividades y la franja de días de estadía deben ser desplazables verticalmente dentro de su pestaña, sin romper el layout general de la pantalla.
- Usa clases utilitarias de Tailwind directamente; si un patrón de clases se repite mucho, extráelo a un componente reutilizable en vez de a una clase custom en CSS.

## Fechas y horas

- Guarda fechas/horas de `trips` y `activities` en Supabase como `timestamptz` (UTC); muéstralas en la hora local del navegador al renderizar.
- `checkin_date`/`checkout_date` de `lodgings` son `date` (sin hora) — un día está "cubierto" si `checkin_date <= día <= checkout_date`.
- Usa una sola librería de fechas de forma consistente en todo el proyecto (no mezclar `date-fns` con manejo manual de `Date` en unas partes sí y otras no).

## Variables de entorno

- `.env` (no commitear) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- `.env.example` sí se commitea, con los nombres de variable vacíos, para que quede documentado qué se necesita configurar.

## Despliegue

- `vite.config.ts` con `base: '/<nombre-del-repo>/'` para que assets y rutas funcionen en GitHub Pages.
- Workflow de GitHub Actions que en cada push a `main`: instala dependencias, build, publica a Pages. No requiere pasos manuales.
- Las variables `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` se inyectan como GitHub Secrets en el paso de build.

## Flujo de trabajo: checklist, commits y pausas

El progreso del proyecto se rastrea en el checklist de `PLAN.md` (sección "Checklist de seguimiento"), con dos tipos de ítems:

- 🤖 el agente lo ejecuta de forma autónoma.
- ⏸ pausa: requiere una acción de la persona (crear un recurso externo, dar credenciales, revisar visualmente, probar en un dispositivo real, etc.) antes de poder continuar.

Reglas:

1. Al completar cualquier ítem del checklist (🤖 o ⏸), marca la casilla correspondiente en `PLAN.md` (`- [x]`) como parte del mismo commit que hace ese avance.
2. Haz commit + push a `origin` después de cada avance significativo — no acumules varios ítems sin commitear — y **siempre** al llegar a una pausa ⏸, aunque el trabajo esté a medias.
3. Los mensajes de commit van **siempre en español**, breves y en modo imperativo (ej. "Agregar formulario de creación de viaje", "Configurar cliente de Supabase"), igual que los commits existentes del repo.
4. Al llegar a un ítem ⏸, detente, explica con claridad qué debe hacer la persona y por qué el agente no puede hacerlo, haz el commit + push de lo avanzado hasta ese punto, y espera una confirmación explícita (ej. "listo", "continúa") antes de retomar el siguiente ítem.
5. No saltes ítems ⏸ ni los simules — si falta un recurso externo (credenciales, revisión visual, prueba en dispositivo), el checklist se detiene ahí realmente.

## Qué NO hacer

- No agregues autenticación, login o control de permisos — está explícitamente fuera de alcance.
- No implementes edición offline ni cola de sincronización de escritura.
- No dejes que `active_trip_cache` almacene más de un viaje a la vez.
- No introduzcas testing, Redux/Zustand, ni librerías de UI de componentes pesadas sin que el usuario lo pida — mantén el proyecto tan simple como el alcance del MVP en `PLAN.md`.
- No implementes presupuesto, checklist de equipaje ni notas generales todavía — están documentadas como futuro en `PLAN.md`, no como parte del MVP actual.
