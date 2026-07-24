# Plan 2 de desarrollo — Viajero App

> **Estado: en curso.** Este plan es independiente de [`PLAN.md`](./PLAN.md) (MVP, cerrado en v0.7.0) y de [`FASE-11.md`](./FASE-11.md) (backlog de presupuesto/checklist/notas generales, sin agendar). Junta un conjunto de requerimientos nuevos pedidos sobre el MVP ya desplegado. Se rastrea con el mismo mecanismo de checklist + pausas que `PLAN.md` §8 — ver §6 de este documento.

## 1. Requerimientos de este plan

1. La lista de viajes del Home se ordena de forma descendente por fecha de inicio (más nuevas primero); el viaje sincronizado, si existe, siempre toma la primera posición sin alterar el orden del resto.
2. Botón en la pestaña Principal de un viaje para eliminar los datos sincronizados (cache local), y otro botón separado para eliminar el viaje completo.
3. Las evidencias de Actividades y Estadías pasan de ser solo una URL a tener nombre + URL; el card muestra el nombre en vez de "Evidencia N". Las evidencias existentes se descartan al migrar (se configuran de cero).
4. Franja de color tipo semáforo en el borde izquierdo de cada card de viaje del Home: plomo si ya pasó, azul si está en curso, verde si es futuro.
5. Si el viaje está en curso, mostrar en su card qué actividad se está realizando en ese momento según lo planificado.
6. Nueva pantalla de solo lectura "Horario": vista tipo calendario en modo Día, con columna de fecha + columna de hora (franjas de 30 min, las 24 horas) + columna de actividades, para ver de un vistazo cuánto dura cada cosa y qué huecos libres hay.
7. Cada card de viaje del Home muestra la cantidad de días y noches ("2D 1N", contando fechas calendario: un viaje que empieza el 25 a las 16h y termina el 26 a las 20h son 2 días y 1 noche). La franja de días de Estadía aplica la misma lógica de noches: solo pide cobertura de las noches necesarias (en el ejemplo, solo el día 25), no de todos los días calendario del viaje. Si una estadía hace checkout un día en el que el viaje continúa, ese día de checkout no cuenta como cubierto — hacen falta más estadías para las noches siguientes. Se agrega validación para que una estadía no se pueda cargar con checkin/checkout fuera del rango de fechas del viaje.

## 2. Decisiones confirmadas (consultadas antes de planear)

- **Evidencias (req. 3):** el nuevo formato `{nombre, url}` aplica a **Actividades** (ya tenían evidencias) y **Estadías** (campo nuevo). La tabla `trips` **no** lleva evidencias propias — "viajes" en el pedido se refería a las actividades del viaje, no a un campo nuevo en `trips`.
- **Actividad en curso en el Home (req. 5):** solo se muestra si el viaje en curso es el que está sincronizado localmente (`active_trip_cache`). El Home no agrega llamadas nuevas a Supabase para esto — si el viaje en curso no fue sincronizado, la card no muestra esa sección (ni error, simplemente no aparece).
- **Acceso a la pantalla Horario (req. 6):** ícono nuevo en el header fijo del detalle de viaje (junto al de `LayoutGrid` que vuelve al Home), visible en las 3 pestañas. No ocupa un 4to ítem de la bottom tab bar (se mantiene la decisión de `PLAN.md` §11 de no tocarla).
- **Horario en viajes multi-día (req. 6):** scroll continuo único que encadena todos los días del viaje (48 franjas de 30 min por día); la columna angosta de fecha marca dónde cambia el día. No hay selector de día aparte.

## 3. Decisiones que tomo con criterio propio (revisar en las pausas ⏸ correspondientes)

Estas no se consultaron por ser de bajo riesgo/reversibles, pero quedan anotadas para que se puedan corregir en la revisión de cada fase:

- **Colores del semáforo:** plomo `slate-400` (pasado), azul `blue-500` (en curso), verde `emerald-500` (futuro) — franja vertical de `w-1.5` pegada al borde izquierdo de la card, sobre las esquinas redondeadas existentes.
- **Botón "Eliminar datos sincronizados":** solo visible si el viaje abierto es el que está en `active_trip_cache` (no tiene sentido en otro viaje, no hay nada que borrar). Borra únicamente el cache local (IndexedDB) — no toca Supabase.
- **Botón "Eliminar viaje":** solo visible al editar un viaje existente (no en `/viajes/nuevo`, igual que el patrón ya usado con "Cancelar" en `PLAN.md` §13). Borra el viaje en Supabase (cascada ya elimina actividades/estadías por FK) y, si coincidía con el cache local, también lo limpia; vuelve al Home.
- **Confirmación antes de borrar:** se resuelve con un modal simple propio (no `window.confirm` nativo), reutilizable — esto cierra el cabo suelto que había quedado anotado en `FASE-11.md` ("confirmación antes de borrar"), y sirve de base si en el futuro se agrega borrado a actividades/estadías individuales.
- **Evidencias sin nombre cargado:** si la persona deja el nombre vacío pero carga una URL, se guarda igual (no bloquea el formulario); en el card se muestra un texto genérico ("Evidencia") como fallback en vez de la URL cruda.
- **Card de Estadía y evidencias:** `LodgingCard` no es colapsable (a diferencia de `ActivityCard`), así que la lista de evidencias se muestra siempre visible debajo de las notas, no detrás de un "expandir".
- **Horario y viaje en curso:** al entrar a la pantalla, si el viaje está en curso hace scroll automático hasta la hora actual.
- **Días/noches en un viaje de un solo día calendario** (empieza y termina el mismo día): 0 noches, el badge muestra "1D 0N" y la franja de Estadía no muestra ningún chip (no hay ninguna noche que cubrir).

## 4. Cambios de modelo de datos

```
activities
  - evidence_urls   text[]              -- se elimina
  + evidence         jsonb, default '[]' -- array de { name: string, url: string }

lodgings
  + evidence         jsonb, default '[]' -- campo nuevo, mismo formato
```

Es un cambio destructivo intencional sobre `activities.evidence_urls` (se pidió explícitamente limpiar las evidencias actuales y configurarlas de cero). Migración nueva en `supabase/migrations/`, siguiendo el mismo patrón que las migraciones incrementales ya existentes del proyecto.

`lib/types.ts` agrega `EvidenceItem { name: string; url: string }`; `Activity.evidence_urls: string[]` pasa a `Activity.evidence: EvidenceItem[]`; `Lodging` suma `evidence: EvidenceItem[]`.

No hay otros cambios de esquema: el semáforo, la actividad en curso y el orden del Home se calculan en el cliente a partir de datos que ya existen (`start_datetime`/`end_datetime`); la pantalla Horario es de solo lectura sobre `activities` ya cargadas por `useActiveTrip`.

## 5. Cambios de navegación

- Home: sin cambios de rutas, solo de orden y presentación de `TripCard`.
- Detalle de viaje: header fijo suma un ícono (ej. `CalendarClock` de `lucide-react`) que navega a `/viajes/:tripId/horario`. Esa ruta no tiene bottom tab bar activa marcada (no pertenece a Principal/Actividades/Estadía) pero sigue mostrando la tab bar para volver a cualquiera de las 3.
- Pestaña Principal: suma, debajo del formulario existente, una sección con los dos botones de borrado (req. 2).

## 6. Flujo de trabajo con el agente

Mismas reglas que `PLAN.md` §8 y el skill `viajero-dev`, aplicadas a este plan:

- 🤖 **Agente:** se ejecuta de forma autónoma.
- ⏸ **Pausa:** requiere una acción de la persona (revisión visual, prueba en dispositivo, credencial externa) antes de seguir.

Al llegar a un ítem ⏸: el agente se detiene, explica qué hay que hacer y por qué no lo puede hacer solo, comitea y pushea el avance hasta ese punto (mensajes en español, imperativo, breves — igual que el resto del repo), y espera una confirmación explícita ("listo", "continúa") antes de retomar. Cada fase completa (o cada avance significativo dentro de una fase) se comitea y pushea por separado, sin acumular. La versión en `package.json` sube en cada fase que termina en algo probable/visible, avisando "Prueba la versión X.Y.Z" para que se confirme en el footer del Home antes de dar feedback — mismo mecanismo que `PLAN.md` §8.

**Para retomar este plan en una conversación nueva:** decir "continúa con PLAN2" (o similar) y indicar la fase donde se quedó si el checklist de abajo no está actualizado a mano.

## 7. Checklist de seguimiento

Leyenda: 🤖 = lo hace el agente · ⏸ = pausa, acción de la persona.

### Fase 1 — Home: orden, semáforo y actividad en curso

- [x] 🤖 Ordenar la lista de viajes del Home por `start_datetime` descendente (más nuevas primero) en `useTrips`; el viaje sincronizado, si existe, se mueve siempre a la primera posición sin alterar el orden del resto.
- [x] 🤖 Agregar franja de color "semáforo" al borde izquierdo de `TripCard` (helper nuevo, ej. `lib/tripStatus.ts`): plomo si `end_datetime < ahora`, azul si `start_datetime <= ahora <= end_datetime`, verde si `start_datetime > ahora`.
- [x] 🤖 Si el viaje en curso coincide con el sincronizado localmente, calcular la actividad cuyo rango contiene el momento actual (a partir de `active_trip_cache.activities`) y mostrarla en una sección chica dentro de la card ("En curso: {summary}", con el horario); si ninguna actividad está activa en ese momento, no se muestra la sección.
- [ ] ⏸ Revisar visualmente el Home (orden, semáforo, actividad en curso) y dar feedback.

### Fase 2 — Días y noches (D/N)

- [ ] 🤖 Helper de cálculo días/noches (ej. `lib/dayNight.ts`): días = cantidad de fechas calendario distintas entre `start_datetime` y `end_datetime` (inclusive), noches = días − 1. Se reutiliza en el Home y en Estadía.
- [ ] 🤖 `TripCard`: mostrar el badge "XD YN" (ej. "2D 1N") calculado a partir de las fechas del viaje.
- [ ] 🤖 `StayDaysStrip`: cambia de un chip por cada día calendario del viaje a un chip por cada noche (noches = días − 1); si el viaje no tiene noches (empieza y termina el mismo día calendario), no se muestra ningún chip.
- [ ] 🤖 Cobertura de una noche por una estadía pasa de `checkin_date <= día <= checkout_date` a `checkin_date <= noche < checkout_date`: el día de checkout de una estadía nunca cubre esa noche, así que si el viaje sigue después de ese checkout hacen falta más estadías (quedan en rojo/sin cubrir hasta agregarlas). `lib/transportNights.ts` ya expresa sus noches con esta misma semántica (`differenceInCalendarDays`), no necesita cambios.
- [ ] 🤖 `LodgingForm`: validar que `checkin_date` no sea anterior a la fecha de inicio del viaje ni `checkout_date` posterior a la fecha de fin del viaje (comparando solo fecha, no hora); si no, error de validación igual al resto de los formularios (`role="alert"`).
- [ ] ⏸ Revisar visualmente el badge D/N en el Home y la franja de noches en Estadía (con un viaje de un solo día y uno de varias noches) y dar feedback.

### Fase 3 — Evidencias con nombre y url

- [ ] 🤖 Migración SQL (`supabase/migrations/`): en `activities`, reemplazar `evidence_urls text[]` por `evidence jsonb not null default '[]'`; en `lodgings`, agregar `evidence jsonb not null default '[]'`. Borra a propósito las evidencias existentes.
- [ ] ⏸ Aplicar la migración en Supabase: si hay un token de acceso disponible en ese momento, el agente la aplica con `supabase db push`; si no, la persona la corre manualmente en el SQL Editor del dashboard con el archivo ya generado.
- [ ] 🤖 Actualizar `lib/types.ts` (`EvidenceItem`, `Activity.evidence`, `Lodging.evidence`) y las funciones CRUD de `data/activities.ts`/`data/lodgings.ts` si hace falta.
- [ ] 🤖 `ActivityForm`: cada fila de evidencia pasa a tener dos campos (nombre + url); `ActivityCard` (vista expandida) muestra el nombre como texto del link.
- [ ] 🤖 `LodgingForm`: agrega la misma sección de evidencias (nombre + url); `LodgingCard`: lista las evidencias como links con su nombre, siempre visibles debajo de las notas.
- [ ] ⏸ Revisar visualmente evidencias en Actividades y Estadías (formulario + card) y dar feedback.

### Fase 4 — Borrar datos sincronizados y borrar viaje completo

- [ ] 🤖 Componente de confirmación reutilizable (modal propio) para acciones destructivas.
- [ ] 🤖 `lib/idb.ts`: función para limpiar `active_trip_cache`; botón "Eliminar datos sincronizados" en Principal (visible solo si el viaje abierto es el sincronizado), que la usa tras confirmar.
- [ ] 🤖 Botón "Eliminar viaje" en Principal (solo al editar un viaje existente): tras confirmar, llama `deleteTrip`, limpia el cache local si coincidía, y navega al Home.
- [ ] ⏸ Revisar el flujo de borrado (ambos botones y sus confirmaciones) y dar feedback.

### Fase 5 — Pantalla Horario

- [ ] 🤖 Nueva ruta `/viajes/:tripId/horario` + ícono en el header del detalle de viaje que navega a ella.
- [ ] 🤖 Componente de la vista (ej. `components/ScheduleGrid.tsx` + `routes/TripDetail/Horario.tsx`): columna angosta de fecha, columna de hora en franjas de 30 min (24 horas), columna de actividades con bloques posicionados por horario y alto proporcional a la duración; scroll continuo encadenando todos los días del viaje. Solo lectura.
- [ ] 🤖 Si el viaje está en curso, hacer scroll automático hasta la hora actual al entrar.
- [ ] ⏸ Revisar visualmente la pantalla Horario (viaje de varios días, actividades consecutivas/superpuestas) y dar feedback.

### Fase 6 — Pulido y despliegue final

- [ ] 🤖 Revisión de accesibilidad/responsive de todo lo nuevo (semáforo, badge D/N, botones de borrado, Horario) en mobile.
- [ ] 🤖 Subir versión en `package.json` y push a `main`.
- [ ] ⏸ Prueba manual completa en un celular real, confirmando la versión en el footer del Home antes de dar el visto bueno final.

## 8. Supuestos registrados

- "En curso" para el semáforo y la actividad activa se calcula con `Date.now()` del navegador en el momento del render (sin timezone especial, igual que el resto de la app).
- La pantalla Horario no permite editar ni crear actividades — es puramente de consulta, tal como se pidió.
- El botón "Eliminar viaje" depende de que la cascada `on delete cascade` ya definida en el esquema (`PLAN.md` §4.1) borre actividades y estadías del viaje — no hace falta borrarlas a mano antes.
