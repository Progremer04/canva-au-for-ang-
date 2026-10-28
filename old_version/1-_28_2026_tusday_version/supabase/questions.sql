-- ==========================================================================
-- « Questions » : les étudiants écrivent à l'enseignant, l'enseignant répond.
-- À coller une fois dans Supabase : SQL Editor → New query → coller tout ce fichier → Run.
-- On peut le relancer sans rien perdre (il ne fait que créer ou remplacer).
--
-- Sécurité : les tables sont fermées (RLS sans aucune règle) ; la page n'y touche que par les
-- fonctions ci-dessous, avec la clé publique (publishable) du projet.
--   - un étudiant ne lit que sa conversation, grâce au jeton secret reçu à l'ouverture
--     (gardé dans son navigateur) ;
--   - l'enseignant lit et répond à tout, avec le code de l'enseignant (le même que pour les notes).
--     Le code n'est stocké que haché (bcrypt). Après 30 codes faux en 10 minutes, les essais
--     sont refusés pendant 10 minutes.
-- Pour changer le code de l'enseignant :
--   update public.qr_reglage set valeur = extensions.crypt('NOUVEAU_CODE', extensions.gen_salt('bf', 10))
--   where cle = 'code_prof';
-- ==========================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.qr_conversation (
  id uuid primary key default gen_random_uuid(),
  jeton_hash text not null,
  nom text not null check (char_length(nom) between 2 and 120),
  classe text not null check (char_length(classe) between 1 and 80),
  cree_le timestamptz not null default now(),
  dernier_le timestamptz not null default now(),
  lu_prof_le timestamptz not null default 'epoch',
  lu_eleve_le timestamptz not null default 'epoch'
);

create table if not exists public.qr_message (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.qr_conversation (id) on delete cascade,
  auteur text not null check (auteur in ('eleve', 'prof')),
  genre text not null check (genre in ('texte', 'image', 'audio', 'fichier')),
  texte text check (char_length(texte) <= 8000),
  fichier_nom text check (char_length(fichier_nom) <= 200),
  fichier_type text check (char_length(fichier_type) <= 120),
  fichier_taille integer,
  duree real,
  reponse_a bigint references public.qr_message (id) on delete set null,
  cree_le timestamptz not null default now()
);
create index if not exists qr_message_conversation on public.qr_message (conversation_id, id);

create table if not exists public.qr_fichier (
  message_id bigint primary key references public.qr_message (id) on delete cascade,
  donnees bytea not null
);

create table if not exists public.qr_reglage (cle text primary key, valeur text not null);
create table if not exists public.qr_echec (id bigint generated always as identity primary key, le timestamptz not null default now());

-- Code de l'enseignant, haché (bcrypt). Gardé tel quel si la ligne existe déjà.
insert into public.qr_reglage (cle, valeur)
values ('code_prof', '$2a$10$qeB0bqg.yaojIIzUFqeO2.OnolveH8VbKALvai110mZpInL8EAib2')
on conflict (cle) do nothing;

alter table public.qr_conversation enable row level security;
alter table public.qr_message enable row level security;
alter table public.qr_fichier enable row level security;
alter table public.qr_reglage enable row level security;
alter table public.qr_echec enable row level security;
revoke all on public.qr_conversation, public.qr_message, public.qr_fichier, public.qr_reglage, public.qr_echec
  from anon, authenticated;

-- ---------- Outils internes (non appelables depuis la page) ----------

create or replace function public.qr__hache(p_jeton text) returns text
language sql immutable set search_path = public, extensions
as $$ select encode(extensions.digest(coalesce(p_jeton, ''), 'sha256'), 'hex') $$;

create or replace function public.qr__eleve(p_id uuid, p_jeton text) returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare v uuid;
begin
  select id into v from qr_conversation where id = p_id and jeton_hash = qr__hache(p_jeton);
  if v is null then raise exception 'conversation_inconnue' using errcode = 'P0002'; end if;
  return v;
end $$;

-- Vrai si le code est bon. Un code faux est noté (sans exception, pour que la note reste).
create or replace function public.qr__prof(p_code text) returns boolean
language plpgsql security definer set search_path = public, extensions
as $$
declare h text;
begin
  if (select count(*) from qr_echec where le > now() - interval '10 minutes') >= 30 then return false; end if;
  select valeur into h from qr_reglage where cle = 'code_prof';
  if h is not null and extensions.crypt(trim(coalesce(p_code, '')), h) = h then return true; end if;
  insert into qr_echec default values;
  delete from qr_echec where le < now() - interval '1 day';
  return false;
end $$;

create or replace function public.qr__message_json(m public.qr_message) returns jsonb
language sql stable security definer set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', m.id, 'auteur', m.auteur, 'genre', m.genre, 'texte', m.texte,
    'fichier_nom', m.fichier_nom, 'fichier_type', m.fichier_type, 'fichier_taille', m.fichier_taille,
    'duree', m.duree, 'reponse_a', m.reponse_a, 'cree_le', m.cree_le,
    'citation', (select jsonb_build_object('id', r.id, 'auteur', r.auteur, 'genre', r.genre,
                                           'texte', left(r.texte, 160), 'fichier_nom', r.fichier_nom)
                 from qr_message r where r.id = m.reponse_a))
$$;

create or replace function public.qr__inserer(
  p_conv uuid, p_auteur text, p_genre text, p_texte text, p_fichier_nom text, p_fichier_type text,
  p_donnees text, p_duree real, p_reponse_a bigint
) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_octets bytea;
  v_texte text := nullif(btrim(coalesce(p_texte, '')), '');
  v_reponse bigint;
  m qr_message;
begin
  if p_genre not in ('texte', 'image', 'audio', 'fichier') then raise exception 'genre_inconnu' using errcode = '22023'; end if;
  if p_genre = 'texte' then
    if v_texte is null then raise exception 'message_vide' using errcode = '22023'; end if;
  else
    if coalesce(p_donnees, '') = '' then raise exception 'fichier_manquant' using errcode = '22023'; end if;
    v_octets := decode(p_donnees, 'base64');
    if length(v_octets) > 5 * 1024 * 1024 then raise exception 'fichier_trop_lourd' using errcode = '22023'; end if;
  end if;
  if p_auteur = 'eleve' and (select count(*) from qr_message where conversation_id = p_conv and auteur = 'eleve'
                             and cree_le > now() - interval '1 minute') >= 20 then
    raise exception 'trop_de_messages' using errcode = '22023';
  end if;
  select id into v_reponse from qr_message where id = p_reponse_a and conversation_id = p_conv;
  insert into qr_message (conversation_id, auteur, genre, texte, fichier_nom, fichier_type, fichier_taille, duree, reponse_a)
  values (p_conv, p_auteur, p_genre, v_texte,
          case when p_genre <> 'texte' then left(coalesce(nullif(p_fichier_nom, ''), p_genre), 200) end,
          case when p_genre <> 'texte' then left(coalesce(nullif(p_fichier_type, ''), 'application/octet-stream'), 120) end,
          case when p_genre <> 'texte' then length(v_octets) end,
          case when p_genre = 'audio' then p_duree end,
          v_reponse)
  returning * into m;
  if v_octets is not null then insert into qr_fichier (message_id, donnees) values (m.id, v_octets); end if;
  update qr_conversation set dernier_le = m.cree_le,
         lu_eleve_le = case when p_auteur = 'eleve' then m.cree_le else lu_eleve_le end,
         lu_prof_le = case when p_auteur = 'prof' then m.cree_le else lu_prof_le end
   where id = p_conv;
  return qr__message_json(m);
end $$;

create or replace function public.qr__fil(p_conv uuid, p_apres bigint) returns jsonb
language sql stable security definer set search_path = public, extensions
as $$
  select coalesce(jsonb_agg(qr__message_json(m) order by m.id), '[]'::jsonb)
  from qr_message m where m.conversation_id = p_conv and m.id > coalesce(p_apres, 0)
$$;

-- ---------- Côté étudiant ----------

create or replace function public.qr_ouvrir(p_nom text, p_classe text) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare v_jeton text := encode(extensions.gen_random_bytes(24), 'hex'); v_id uuid;
begin
  if char_length(btrim(coalesce(p_nom, ''))) < 2 then raise exception 'nom_manquant' using errcode = '22023'; end if;
  if btrim(coalesce(p_classe, '')) = '' then raise exception 'classe_manquante' using errcode = '22023'; end if;
  if (select count(*) from qr_conversation where cree_le > now() - interval '1 minute') >= 30 then
    raise exception 'trop_de_conversations' using errcode = '22023';
  end if;
  insert into qr_conversation (jeton_hash, nom, classe)
  values (qr__hache(v_jeton), left(btrim(p_nom), 120), left(btrim(p_classe), 80))
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'jeton', v_jeton);
end $$;

create or replace function public.qr_eleve_fil(p_id uuid, p_jeton text, p_apres bigint default 0) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare v uuid := qr__eleve(p_id, p_jeton); c qr_conversation;
begin
  update qr_conversation set lu_eleve_le = now() where id = v returning * into c;
  return jsonb_build_object('nom', c.nom, 'classe', c.classe, 'lu_prof_le', c.lu_prof_le, 'messages', qr__fil(v, p_apres));
end $$;

create or replace function public.qr_eleve_envoyer(
  p_id uuid, p_jeton text, p_genre text, p_texte text default null, p_fichier_nom text default null,
  p_fichier_type text default null, p_donnees text default null, p_duree real default null, p_reponse_a bigint default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  return qr__inserer(qr__eleve(p_id, p_jeton), 'eleve', p_genre, p_texte, p_fichier_nom, p_fichier_type, p_donnees, p_duree, p_reponse_a);
end $$;

create or replace function public.qr_eleve_fichier(p_id uuid, p_jeton text, p_message bigint) returns text
language plpgsql security definer set search_path = public, extensions
as $$
declare v uuid := qr__eleve(p_id, p_jeton);
begin
  return (select encode(f.donnees, 'base64') from qr_fichier f join qr_message m on m.id = f.message_id
          where f.message_id = p_message and m.conversation_id = v);
end $$;

-- ---------- Côté enseignant (le code est demandé à chaque appel) ----------

create or replace function public.qr_prof_conversations(p_code text) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not qr__prof(p_code) then return jsonb_build_object('erreur', 'code'); end if;
  return jsonb_build_object('conversations', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'nom', c.nom, 'classe', c.classe, 'cree_le', c.cree_le, 'dernier_le', c.dernier_le,
      'lu_eleve_le', c.lu_eleve_le,
      'non_lus', (select count(*) from qr_message m where m.conversation_id = c.id and m.auteur = 'eleve' and m.cree_le > c.lu_prof_le),
      'dernier', (select jsonb_build_object('auteur', m.auteur, 'genre', m.genre, 'texte', left(m.texte, 120), 'fichier_nom', m.fichier_nom)
                  from qr_message m where m.conversation_id = c.id order by m.id desc limit 1)
    ) order by c.dernier_le desc)
    from qr_conversation c), '[]'::jsonb));
end $$;

create or replace function public.qr_prof_fil(p_code text, p_conv uuid, p_apres bigint default 0) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare c qr_conversation;
begin
  if not qr__prof(p_code) then return jsonb_build_object('erreur', 'code'); end if;
  update qr_conversation set lu_prof_le = now() where id = p_conv returning * into c;
  if c.id is null then return jsonb_build_object('erreur', 'conversation_inconnue'); end if;
  return jsonb_build_object('nom', c.nom, 'classe', c.classe, 'lu_eleve_le', c.lu_eleve_le, 'messages', qr__fil(c.id, p_apres));
end $$;

create or replace function public.qr_prof_envoyer(
  p_code text, p_conv uuid, p_genre text, p_texte text default null, p_fichier_nom text default null,
  p_fichier_type text default null, p_donnees text default null, p_duree real default null, p_reponse_a bigint default null
) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not qr__prof(p_code) then return jsonb_build_object('erreur', 'code'); end if;
  if not exists (select 1 from qr_conversation where id = p_conv) then return jsonb_build_object('erreur', 'conversation_inconnue'); end if;
  return qr__inserer(p_conv, 'prof', p_genre, p_texte, p_fichier_nom, p_fichier_type, p_donnees, p_duree, p_reponse_a);
end $$;

create or replace function public.qr_prof_fichier(p_code text, p_message bigint) returns text
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not qr__prof(p_code) then return null; end if;
  return (select encode(donnees, 'base64') from qr_fichier where message_id = p_message);
end $$;

create or replace function public.qr_prof_supprimer(p_code text, p_conv uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not qr__prof(p_code) then return jsonb_build_object('erreur', 'code'); end if;
  delete from qr_conversation where id = p_conv;
  return jsonb_build_object('ok', true);
end $$;

-- Seules les fonctions publiques (sans « __ ») sont appelables par la page.
revoke all on function public.qr__hache(text), public.qr__eleve(uuid, text), public.qr__prof(text),
  public.qr__message_json(public.qr_message), public.qr__inserer(uuid, text, text, text, text, text, text, real, bigint),
  public.qr__fil(uuid, bigint) from public, anon, authenticated;
revoke all on function public.qr_ouvrir(text, text), public.qr_eleve_fil(uuid, text, bigint),
  public.qr_eleve_envoyer(uuid, text, text, text, text, text, text, real, bigint), public.qr_eleve_fichier(uuid, text, bigint),
  public.qr_prof_conversations(text), public.qr_prof_fil(text, uuid, bigint),
  public.qr_prof_envoyer(text, uuid, text, text, text, text, text, real, bigint), public.qr_prof_fichier(text, bigint),
  public.qr_prof_supprimer(text, uuid) from public;
grant execute on function public.qr_ouvrir(text, text), public.qr_eleve_fil(uuid, text, bigint),
  public.qr_eleve_envoyer(uuid, text, text, text, text, text, text, real, bigint), public.qr_eleve_fichier(uuid, text, bigint),
  public.qr_prof_conversations(text), public.qr_prof_fil(text, uuid, bigint),
  public.qr_prof_envoyer(text, uuid, text, text, text, text, text, real, bigint), public.qr_prof_fichier(text, bigint),
  public.qr_prof_supprimer(text, uuid) to anon, authenticated;

-- Que l'API voie tout de suite les nouvelles fonctions.
notify pgrst, 'reload schema';
