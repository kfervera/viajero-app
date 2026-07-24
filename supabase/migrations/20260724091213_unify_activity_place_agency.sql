-- Unifica lugar y agencia en un solo campo (place): para actividades de
-- categoría "transport" el formulario lo etiqueta "Agencia", para el resto
-- "Lugar". Mismo tipo de dato (texto), no hace falta columna aparte.

alter table activities
  drop column agency;
