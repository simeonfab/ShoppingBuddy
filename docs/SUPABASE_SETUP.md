# Supabase Free Plan setup

Create or select a Supabase Free Plan project without adding billing details. In its SQL editor, run `supabase/migrations/202611080001_initial_sync.sql`. In **Authentication**, enable email/password and set an appropriate site URL for the environment you are testing.

Copy `.env.example` to `.env.local` and fill in only the browser-safe project URL and anonymous key. Never use a service-role key in this app:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Restart the app after changing environment variables. Settings then offers create-account, sign-in, password reset and sign-out. Local lists remain available without an account. The SQL migration enables RLS on every user-data table and restricts reads and writes to `auth.uid()`; `npm run check:rls` statically checks the declared policy coverage. A live two-account policy test and a two-isolated-device sync test must still be run against the configured project before calling backend security or cross-device sync verified.
