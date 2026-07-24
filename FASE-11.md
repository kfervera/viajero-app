# Fase 11 — Backlog futuro (fuera del MVP)

El MVP de Viajero App (Fases 0–10 de `PLAN.md`) está completo y desplegado. Este documento junta las 3 features que quedaron **fuera del MVP a propósito** (ver `PLAN.md` §2), como historias de usuario con una recomendación de alcance para cuando se retomen. Ninguna está agendada ni tiene fecha — se implementan una por vez, cuando se decida arrancar.

Las 3 comparten el mismo principio de diseño que el resto de la app: sin autenticación, datos compartidos entre las 2 personas, tablas simples relacionadas por `trip_id`, sin sobre-ingeniería.

## Prioridad recomendada

1. **Notas generales del viaje** — la más simple, es prácticamente el mismo patrón que ya existe (texto libre con timestamps), bajo riesgo.
2. **Checklist de equipaje** — CRUD simple con un booleano, un poco más de UI (marcar/desmarcar) pero sin ambigüedades de producto.
3. **Presupuesto / gastos** — la más valiosa pero también la que más preguntas de producto abre (moneda, quién pagó, si se calcula un "quién le debe a quién"). Conviene planearla en su propia conversación antes de tocar código, no arrancar directo a codear.

---

## 1. Notas generales del viaje

**Historia:** Como viajero, quiero anotar notas de texto libre a nivel de todo el viaje (no atadas a una actividad puntual) para guardar información que aplica al viaje entero — ej. "el wifi del Airbnb es xyz123", "el vuelo de vuelta permite 1 valija por persona".

No confundir con las notas que ya existen por actividad (`activities.notes`, propias de cada actividad).

**Modelo de datos sugerido:**

```
trip_notes
  id          uuid, pk
  trip_id     uuid, fk -> trips.id, on delete cascade
  content     text
  created_at  timestamptz, default now()
  updated_at  timestamptz
```

Tabla propia (no una columna `text[]` como en actividades) porque acá cada nota se edita y se borra de forma independiente desde su propia card, con su propio timestamp — el patrón de columna array le queda bien a las notas de una actividad porque son efímeras y van todas juntas en el formulario, pero acá tiene más sentido tratarlas como entidades propias.

**UI sugerida:** no amerita una 4ta pestaña — según `PLAN.md` §11 la bottom tab bar se mantiene con 3 ítems fijos. Recomiendo agregarlas dentro de la pestaña **Principal**, debajo del formulario del viaje: lista de notas + botón "Agregar nota" con el mismo patrón de formulario oculto que Actividades/Estadía.

**Abierto para definir:** ¿alcanza con texto plano o conviene soportar algo de formato (saltos de línea ya andan con `<textarea>`, no haría falta markdown)?

---

## 2. Checklist de equipaje

**Historia:** Como viajero, quiero armar una lista de cosas para llevar en el viaje y marcarlas como empacadas, para no olvidarme nada antes de salir.

**Modelo de datos sugerido:**

```
packing_checklist_items
  id          uuid, pk
  trip_id     uuid, fk -> trips.id, on delete cascade
  label       text
  is_packed   boolean, default false
  created_at  timestamptz, default now()
  updated_at  timestamptz
```

**UI sugerida:** mismo problema de dónde ubicarla que las notas generales. Recomiendo un mismo lugar: pestaña **Principal**, como segunda sección debajo del formulario del viaje (o debajo de las notas generales si se implementan ambas). Lista con checkbox tipo to-do — tap en el ítem alterna `is_packed` (tachado o gris cuando está marcado), botón "Agregar ítem" con un input simple (sin formulario colapsable completo, es solo un campo de texto).

**Abierto para definir:** ¿lista única compartida entre las 2 personas (consistente con el resto de la app, que no distingue usuarios) o llega a hacer falta alguna forma de saber "quién" empacó qué? Recomiendo lista única compartida — agregar distinción por persona implicaría meter algo de identidad de usuario, que está explícitamente fuera de alcance (`PLAN.md` §2).

---

## 3. Presupuesto / gastos

**Historia:** Como viajero, quiero registrar los gastos del viaje (monto, categoría, quién pagó) para llevar control de cuánto gastamos y tener una idea de cómo dividirlo entre los 2.

Esta es la que más preguntas de producto abre — antes de codear conviene resolver:

- **¿Multi-moneda?** Si el viaje es a otro país (ej. Perú), los gastos probablemente se hacen en moneda local. ¿Se registra un monto + código de moneda por gasto (ej. "120 PEN"), o todo se anota ya convertido a una moneda de referencia? Lo primero es más simple de cargar en el momento; lo segundo es más simple de sumar/totalizar. Recomiendo registrar monto + moneda tal cual se pagó (más fiel y rápido de cargar), y sumar totales agrupados por moneda en vez de forzar una conversión (evita la complejidad de tasas de cambio, que además cambian día a día).
- **¿"Quién pagó" y split?** Como no hay usuarios/auth, no hay de dónde sacar una lista de personas del sistema — la opción simple es un campo de texto libre (`paid_by`) que cada quien completa a mano con su nombre, igual de simple que como se maneja `phone_number`/`place` en el resto del modelo. Calcular automáticamente "quién le debe a quién" es una feature aparte y más ambiciosa (hay que decidir reglas de split — mitad y mitad, por gasto, etc.) — recomiendo dejarla explícitamente fuera de este primer corte y limitarse a listar gastos + un total por persona pagador, sin lógica de liquidación.
- **¿Categorías fijas o texto libre?** El resto de la app usa taxonomía fija para actividades (evita íconos huérfanos). Para gastos, una lista corta fija (ej. Comida, Transporte, Alojamiento, Compras, Otro) sería consistente con ese patrón y permite un ícono por categoría igual que en Actividades.

**Modelo de datos sugerido (primer corte, sin split):**

```
budget_items
  id             uuid, pk
  trip_id        uuid, fk -> trips.id, on delete cascade
  description    text
  amount         numeric
  currency       text                 -- ej. "PEN", "USD" — texto libre o lista corta fija
  category       text, nullable       -- taxonomía fija, igual patrón que activities.category
  paid_by        text, nullable       -- texto libre, sin relación a una tabla de usuarios
  expense_date   date
  notes          text, nullable
  created_at     timestamptz, default now()
  updated_at     timestamptz
```

**UI sugerida:** a diferencia de notas/checklist, esta sí tiene suficiente entidad como para justificar su propia pestaña o una pantalla aparte accesible desde Principal (lista de gastos + total(es) arriba, formulario oculto tipo "Agregar gasto" igual que Actividades/Estadía). Definir esto junto con el resto de las preguntas abiertas antes de empezar.

---

## Nota relacionada: confirmación antes de borrar

`PLAN.md` había dejado pendiente la pregunta "¿se pide confirmación antes de borrar un viaje/actividad/estadía?". En la práctica, **el MVP no tiene ninguna UI de borrado todavía** — las funciones `deleteTrip`/`deleteActivity`/`deleteLodging` existen en `src/data/*.ts` pero no están conectadas a ningún botón; borrar hoy se hace directo en Supabase. Cuando se agregue borrado (para viajes/actividades/estadías existentes, o para ítems de checklist/gastos nuevos), conviene resolver esta pregunta una sola vez y aplicar el mismo patrón de confirmación en todos lados, en vez de decidirlo feature por feature.
