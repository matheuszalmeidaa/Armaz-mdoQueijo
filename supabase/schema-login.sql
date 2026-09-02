-- ============================================================
-- Login pelo Supabase — usuários com senha criptografada (pgcrypto).
-- ADITIVO. Rode no SQL Editor do Supabase.
-- ============================================================
create extension if not exists pgcrypto;

alter table usuarios add column if not exists email      text;
alter table usuarios add column if not exists senha_hash text;
create unique index if not exists idx_usuarios_email
  on usuarios (lower(email)) where email is not null;

-- Valida email + senha (compara com o hash) e retorna o usuário + perfil.
create or replace function verificar_login(p_email text, p_senha text)
returns table (id uuid, nome text, email text, perfil text, permissoes jsonb)
language sql
stable
security definer
as $$
  select u.id, u.nome, u.email, p.nome as perfil,
         coalesce(p.permissoes, '{}'::jsonb) as permissoes
  from usuarios u
  left join perfis p on p.id = u.perfil_id
  where u.ativo
    and lower(u.email) = lower(p_email)
    and u.senha_hash = crypt(p_senha, u.senha_hash)
  limit 1;
$$;

-- Usuário admin inicial (TROQUE a senha depois): admin@armazem / armazem
insert into usuarios (id, nome, email, senha_hash, perfil_id)
select gen_random_uuid(), 'Administrador', 'admin@armazem',
       crypt('armazem', gen_salt('bf')),
       (select id from perfis where nome = 'Administrador' limit 1)
where not exists (
  select 1 from usuarios where lower(email) = 'admin@armazem'
);
