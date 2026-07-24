-- Igual que en activities: si hay map_url se muestra ícono de mapa en la
-- card, si hay phone_number se muestra ícono de WhatsApp -> wa.me/{numero}.

alter table lodgings
  add column map_url text,
  add column phone_number text;
