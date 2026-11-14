-- Petites fonctions d'assertion pour les tests SQL (local uniquement).
create schema if not exists test;
grant usage on schema test to anon, authenticated;

create or replace function test.ok(cond boolean, label text) returns text language plpgsql as $$
begin
  if cond is not true then
    raise exception 'ÉCHEC : %', label;
  end if;
  return 'ok - ' || label;
end $$;

-- Exécute sql et vérifie qu'il échoue avec le code SQLSTATE attendu.
create or replace function test.throws(sql text, expected_code text, label text) returns text language plpgsql as $$
begin
  execute sql;
  raise exception 'ÉCHEC : % (aucune erreur levée)', label;
exception
  when others then
    if sqlstate = expected_code then
      return 'ok - ' || label;
    end if;
    if sqlerrm like 'ÉCHEC :%' then
      raise;
    end if;
    raise exception 'ÉCHEC : % (code % au lieu de % : %)', label, sqlstate, expected_code, sqlerrm;
end $$;

-- Simule une session Supabase : anon (null) ou utilisateur connecté.
create or replace function test.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', case when uid is null then '' else json_build_object('sub', uid)::text end, false);
$$;

grant execute on all functions in schema test to anon, authenticated;
