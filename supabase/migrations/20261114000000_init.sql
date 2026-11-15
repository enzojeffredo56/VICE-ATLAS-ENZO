-- =====================================================================
-- VICE ATLAS — Migration 0 : socle commun
-- Phase 1 : uniquement les briques transverses réutilisées par toutes les
-- tables des phases suivantes. Aucune table métier ici.
-- =====================================================================

-- Extensions
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;  -- fonctions cryptographiques
create extension if not exists citext with schema extensions;    -- pseudos insensibles à la casse (phase 4)

-- Schéma privé pour les fonctions internes (non exposé par l'API REST)
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Rôles applicatifs (section P du cahier des charges)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'moderator', 'admin');
  end if;
end$$;

-- Trigger générique : met à jour updated_at à chaque modification
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function private.set_updated_at() is
  'Trigger BEFORE UPDATE : renseigne updated_at. À brancher sur chaque table métier.';
