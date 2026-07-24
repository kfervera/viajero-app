-- Amplía activities con los campos del timeline: summary (título corto que
-- se ve colapsado), lugar, mapa, agencia, contacto y notas libres.
-- description pasa a ser opcional (detalle largo, se ve al expandir la card).

alter table activities
  add column summary text,
  add column place text,
  add column map_url text,
  add column agency text,
  add column phone_number text,
  add column notes text[] not null default '{}';

update activities set summary = description where summary is null;

alter table activities
  alter column summary set not null,
  alter column description drop not null;
