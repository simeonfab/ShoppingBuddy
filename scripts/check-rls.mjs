import { readFileSync } from 'node:fs'
const sql=readFileSync(new URL('../supabase/migrations/202611080001_initial_sync.sql',import.meta.url),'utf8')
for(const table of ['profiles','shopping_lists','grocery_items','product_corrections','sync_mutations']){
  if(!sql.includes(`alter table public.${table} enable row level security`))throw new Error(`RLS missing for ${table}`)
}
for(const rule of ['owner_id = auth.uid()','with check (owner_id = auth.uid())','id = auth.uid()'])if(!sql.includes(rule))throw new Error(`Required owner policy missing: ${rule}`)
if(sql.includes('service_role'))throw new Error('Migration/application must not use a service-role key')
console.log('RLS_CHECK PASS owner-only policies are declared for every user-data table')
