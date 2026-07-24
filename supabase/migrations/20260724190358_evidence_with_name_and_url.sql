-- Las evidencias pasan de ser solo una URL (text[]) a tener nombre + url
-- (jsonb, array de {name, url}). Se descartan a propósito las evidencias
-- existentes de activities: el formato anterior no es compatible y se
-- pidió configurarlas de cero (ver PLAN2.md Fase 3). lodgings suma el
-- campo por primera vez.

alter table activities
  drop column evidence_urls,
  add column evidence jsonb not null default '[]'::jsonb;

alter table lodgings
  add column evidence jsonb not null default '[]'::jsonb;
