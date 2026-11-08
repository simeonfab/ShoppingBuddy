-- Keep owner-only RLS efficient as synced data grows.
create index if not exists grocery_items_list_id_idx
  on public.grocery_items (list_id);

create index if not exists sync_mutations_owner_id_idx
  on public.sync_mutations (owner_id);

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists lists_owner_select on public.shopping_lists;
create policy lists_owner_select on public.shopping_lists
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists lists_owner_insert on public.shopping_lists;
create policy lists_owner_insert on public.shopping_lists
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists lists_owner_update on public.shopping_lists;
create policy lists_owner_update on public.shopping_lists
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists lists_owner_delete on public.shopping_lists;
create policy lists_owner_delete on public.shopping_lists
  for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists items_owner_select on public.grocery_items;
create policy items_owner_select on public.grocery_items
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists items_owner_insert on public.grocery_items;
create policy items_owner_insert on public.grocery_items
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.shopping_lists l
      where l.id = list_id
        and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists items_owner_update on public.grocery_items;
create policy items_owner_update on public.grocery_items
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.shopping_lists l
      where l.id = list_id
        and l.owner_id = (select auth.uid())
    )
  );

drop policy if exists items_owner_delete on public.grocery_items;
create policy items_owner_delete on public.grocery_items
  for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists corrections_owner_all on public.product_corrections;
create policy corrections_owner_all on public.product_corrections
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists mutations_owner_select on public.sync_mutations;
create policy mutations_owner_select on public.sync_mutations
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists mutations_owner_insert on public.sync_mutations;
create policy mutations_owner_insert on public.sync_mutations
  for insert to authenticated
  with check (owner_id = (select auth.uid()));
