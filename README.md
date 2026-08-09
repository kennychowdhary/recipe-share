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
