# recipe-share

Recipes that someone actually cooked. A small Next.js app for sharing home
recipes with a multi-step submission wizard, browse grid, and recipe pages.

Stack: Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres) · Vercel.
Everything runs on free tiers.

## Local development

```bash
npm install
npm run dev
```

Without Supabase configured, the home page and wizard render but browsing and
publishing are disabled with a friendly notice.

## One-time Supabase setup (free tier)

1. Create a project at [supabase.com](https://supabase.com) (any region near you).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Go to **Project Settings → API** and copy the Project URL and the `anon` key.
4. `cp .env.example .env.local` and fill both values in. Restart `npm run dev`.

The anon key is safe to expose to browsers: row-level security only allows
reading and inserting recipes, never editing or deleting.

## Recipe parsing with Claude (optional)

The first screen of the share flow lets you paste a recipe in any format and
have Claude sort it into the structured fields. Set `ANTHROPIC_API_KEY` in
`.env.local` to enable it; without it the wizard still works, you just type the
fields yourself.

**The key must never carry a `NEXT_PUBLIC_` prefix.** That prefix is what tells
Next.js to inline a value into the browser bundle — the Supabase anon key is
meant to be public, an Anthropic key is not. Parsing happens in
[`app/api/parse-recipe/route.ts`](app/api/parse-recipe/route.ts), which runs
only on the server.

If you're going through a gateway rather than `api.anthropic.com`, set
`ANTHROPIC_BASE_URL` and `ANTHROPIC_MODEL` — gateways namespace model IDs
(e.g. `azure/anthropic/claude-opus-5`).

## Deploying to Vercel (free tier)

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project**, import the repo, keep all defaults.
3. In the project's **Settings → Environment Variables**, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values
   as `.env.local`), then redeploy.

Every `git push` to `main` deploys automatically; branches get preview URLs.

## Where things live

- `app/submit/page.tsx` — the 5-step share wizard (dish → ingredients → steps → extras → review)
- `app/browse/page.tsx` — recipe grid
- `app/recipes/[id]/page.tsx` — a single recipe
- `app/api/recipes/route.ts` — POST endpoint that validates and inserts
- `supabase/schema.sql` — the whole database schema
- `lib/types.ts` — the `Recipe` shape shared by all of the above

## Ideas for later

- Photo upload (Supabase Storage has a free tier)
- Search and filtering by tag/cuisine
- Simple moderation (an `approved` column + a secret admin page)
