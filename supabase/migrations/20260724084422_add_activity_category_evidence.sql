-- Agrega categoría/subcategoría (taxonomía fija definida en el frontend,
-- ver src/lib/activityCategories.ts) y evidencias (URLs, ej. archivos de
-- Drive) a activities. end_datetime se sigue guardando igual: el formulario
-- ahora captura "duración" y calcula la fecha de fin, no cambia el esquema.

alter table activities
  add column category text,
  add column subcategory text,
  add column evidence_urls text[] not null default '{}';
