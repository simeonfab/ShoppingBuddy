-- SmartShop owner-only sync schema for the Supabase Free Plan.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.shopping_lists (id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade, local_id text not null, name text not null, store_id text not null, archived boolean not null default false, revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(owner_id,local_id));
create table public.grocery_items (id uuid primary key, list_id uuid not null references public.shopping_lists(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade, local_id text not null, name text not null, section text not null, quantity numeric not null default 1, unit text not null default '', note text, done boolean not null default false, favourite boolean, revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(owner_id,local_id));
create table public.product_corrections (id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, store_id text not null, product_name text not null, section text not null, revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(owner_id,store_id,product_name));
create table public.sync_mutations (mutation_id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade, applied_at timestamptz not null default now());

alter table public.profiles enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.grocery_items enable row level security;
alter table public.product_corrections enable row level security;
alter table public.sync_mutations enable row level security;
create policy profiles_owner_all on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy lists_owner_select on public.shopping_lists for select to authenticated using (owner_id = auth.uid());
create policy lists_owner_insert on public.shopping_lists for insert to authenticated with check (owner_id = auth.uid());
create policy lists_owner_update on public.shopping_lists for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy lists_owner_delete on public.shopping_lists for delete to authenticated using (owner_id = auth.uid());
create policy items_owner_select on public.grocery_items for select to authenticated using (owner_id = auth.uid());
create policy items_owner_insert on public.grocery_items for insert to authenticated with check (owner_id = auth.uid() and exists(select 1 from public.shopping_lists l where l.id=list_id and l.owner_id=auth.uid()));
create policy items_owner_update on public.grocery_items for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and exists(select 1 from public.shopping_lists l where l.id=list_id and l.owner_id=auth.uid()));
create policy items_owner_delete on public.grocery_items for delete to authenticated using (owner_id = auth.uid());
create policy corrections_owner_all on public.product_corrections for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy mutations_owner_select on public.sync_mutations for select to authenticated using (owner_id = auth.uid());
create policy mutations_owner_insert on public.sync_mutations for insert to authenticated with check (owner_id = auth.uid());

create or replace function public.apply_smartshop_snapshot(p_mutation_id uuid,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare v_owner uuid:=auth.uid();v_list jsonb;v_item jsonb;v_store record;v_product record;v_existing bigint;v_conflict boolean:=false;
begin
 if v_owner is null then raise exception 'Authentication required';end if;
 if exists(select 1 from sync_mutations where mutation_id=p_mutation_id and owner_id=v_owner) then return jsonb_build_object('applied',true,'duplicate',true,'conflict',false);end if;
 for v_list in select * from jsonb_array_elements(coalesce(p_payload->'lists','[]'::jsonb)) loop
  select revision into v_existing from shopping_lists where id=(v_list->>'syncId')::uuid and owner_id=v_owner;
  if v_existing is not null and v_existing>coalesce((v_list->>'revision')::bigint,0) then v_conflict:=true;continue;end if;
  insert into shopping_lists(id,owner_id,local_id,name,store_id,archived,revision,created_at,updated_at,deleted_at) values((v_list->>'syncId')::uuid,v_owner,v_list->>'id',v_list->>'name',v_list->>'storeId',coalesce((v_list->>'archived')::boolean,false),coalesce(v_existing,0)+1,coalesce((v_list->>'createdAt')::timestamptz,now()),now(),nullif(v_list->>'deletedAt','')::timestamptz)
  on conflict(id) do update set name=excluded.name,store_id=excluded.store_id,archived=excluded.archived,revision=shopping_lists.revision+1,updated_at=now(),deleted_at=excluded.deleted_at where shopping_lists.owner_id=v_owner;
  for v_item in select * from jsonb_array_elements(coalesce(v_list->'items','[]'::jsonb)) loop
   select revision into v_existing from grocery_items where id=(v_item->>'syncId')::uuid and owner_id=v_owner;
   if v_existing is not null and v_existing>coalesce((v_item->>'revision')::bigint,0) then v_conflict:=true;continue;end if;
   insert into grocery_items(id,list_id,owner_id,local_id,name,section,quantity,unit,note,done,favourite,revision,created_at,updated_at,deleted_at) values((v_item->>'syncId')::uuid,(v_list->>'syncId')::uuid,v_owner,v_item->>'id',v_item->>'name',v_item->>'section',coalesce((v_item->>'quantity')::numeric,1),coalesce(v_item->>'unit',''),v_item->>'note',coalesce((v_item->>'done')::boolean,false),(v_item->>'favourite')::boolean,coalesce(v_existing,0)+1,coalesce((v_item->>'createdAt')::timestamptz,now()),now(),nullif(v_item->>'deletedAt','')::timestamptz)
   on conflict(id) do update set name=excluded.name,section=excluded.section,quantity=excluded.quantity,unit=excluded.unit,note=excluded.note,done=excluded.done,favourite=excluded.favourite,revision=grocery_items.revision+1,updated_at=now(),deleted_at=excluded.deleted_at where grocery_items.owner_id=v_owner;
  end loop;
 end loop;
 for v_store in select * from jsonb_each(coalesce(p_payload->'corrections','{}'::jsonb)) loop
  for v_product in select * from jsonb_each_text(v_store.value) loop
   insert into product_corrections(owner_id,store_id,product_name,section) values(v_owner,v_store.key,v_product.key,v_product.value)
   on conflict(owner_id,store_id,product_name) do update set section=excluded.section,revision=product_corrections.revision+1,updated_at=now(),deleted_at=null;
  end loop;
 end loop;
 if not v_conflict then insert into sync_mutations(mutation_id,owner_id) values(p_mutation_id,v_owner);end if;
 return jsonb_build_object('applied',not v_conflict,'duplicate',false,'conflict',v_conflict);
end $$;
grant execute on function public.apply_smartshop_snapshot(uuid,jsonb) to authenticated;
