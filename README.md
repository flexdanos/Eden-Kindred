# Eden Kindred

A worship community site with a mobile-money partnership programme and an admin console.

Public site is the brand surface. `/admin` is a separate product surface that controls what the public site shows.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Public pages render on the server so a phone gets populated HTML, not a fetch waterfall |
| Database | Supabase Postgres | |
| Queries | **Drizzle** | The admin dashboard needs `SUM`/`GROUP BY`; PostgREST cannot express those |
| Auth, Storage, Realtime | **supabase-js** | Drizzle does not replace these and should not try |
| Payments | Paystack (mobile money) | Ghana. See the pledge section below — this is the part that surprises people |
| UI | Tailwind v4 + shadcn/ui | shadcn on the admin for real keyboard/focus behaviour in tables, dialogs, forms |
| Motion | Motion + Lenis | Lenis is desktop-only on purpose |

### The Drizzle / supabase-js boundary

This matters more than it looks:

- **Drizzle** — all server-side reads on public pages, all admin writes, the Paystack webhook, every aggregate.
- **supabase-js** — auth, Storage uploads, Realtime, anything running in the browser.

**Drizzle bypasses RLS.** It connects as a privileged Postgres role, so the policies in `supabase/rls-policies.sql` never evaluate on a Drizzle query. Those policies are a backstop for the anon key reaching Postgres through PostgREST. The actual authorisation for the admin is `assertStaff()` / `assertAdmin()` in [src/lib/auth/guard.ts](src/lib/auth/guard.ts), called at the top of every admin route and Server Action.

If you add an admin Server Action without a guard, you have shipped an unauthenticated write endpoint. There is no policy that will catch it.

## Setup

### 1. Supabase

Create a project, then from **Project Settings → Database → Connection string**:

- `DATABASE_URL` — transaction pooler, port **6543**. Runtime.
- `DIRECT_URL` — direct connection, port **5432**. Migrations only.

The pooler settings in [src/lib/db/index.ts](src/lib/db/index.ts) (`prepare: false`, `max: 1`) are load-bearing on serverless. Changing them produces intermittent `prepared statement does not exist` errors that only appear under concurrency.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill it in. `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix deliberately — it bypasses RLS entirely and must never reach the browser.

### 3. Schema, policies, seed

```bash
npm run db:push
```

Then in the Supabase SQL editor, run in order:

1. `supabase/rls-policies.sql` — policies, the `profiles` sync trigger, and the `public_partners` view
2. `supabase/storage.sql` — the `media` bucket and its object policies
3. `supabase/seed.sql` — optional starter content

### 4. Make yourself an admin

Sign in once at `/login` to create your `profiles` row, then:

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'you@example.com'
);
```

### 5. Paystack

Set the webhook URL in the Paystack dashboard to `https://your-domain/api/paystack/webhook`.

Deliveries are signed with HMAC-SHA512 of the **raw** body using your secret key — there is no separate webhook secret. [The handler](src/app/api/paystack/webhook/route.ts) reads `await req.text()` and verifies against that string; parsing to JSON first and re-serialising changes key order and the signature will never match.

### 6. Reminder cron

`vercel.json` schedules `/api/cron/pledge-reminders` daily at 08:00. It needs `CRON_SECRET` set. Without it the endpoint returns 401 and pledges silently stop advancing.

```bash
npm run dev
```

## Mobile money and the pledge model

**Ghana mobile money has no reusable authorisation.** Paystack supports recurring charges for cards and Nigerian direct debit only. Every MoMo charge requires the giver to approve a fresh prompt with their OTP and PIN, on their handset.

So there is no `subscriptions` table, because nothing subscribes. Instead:

- **`pledges`** — a standing intent plus a cadence and a reminder date.
- **`pledge_periods`** — one row per due window. Makes "pledged vs received" a plain join, and lets the reminder job stay idempotent via a unique index on `(pledge_id, period_start)`.
- **`/api/cron/pledge-reminders`** — opens the next window when it comes due and marks unpaid past windows missed after a three-day grace.

The admin dashboard's headline figure is **pledged vs received this month**, which is the honest number. A subscription count would not be.

The giving UI states this plainly rather than glossing it. A partner who expects auto-debit and doesn't get it assumes the ministry lost their money.

### Money is integers

Every amount is `amountMinor` — an integer count of pesewas. Paystack's API speaks minor units, and integers keep `SUM()` exact. Convert at the edges only, via [src/lib/money.ts](src/lib/money.ts).

## Design

[PRODUCT.md](PRODUCT.md) is the strategic brief; [DESIGN.md](DESIGN.md) is the visual system. Two things worth knowing before editing styles:

- **The brand palette is namespaced `--brand-*`.** `shadcn init` writes unprefixed `--primary` / `--accent` / `--muted` and overwrote the brand tokens once already. shadcn's semantic set is mapped onto the brand at the bottom of `:root` in [globals.css](src/app/globals.css).
- **Contrast is measured, not estimated.** `npm run check:contrast` re-verifies the palette. Change a token, change the script, re-run.

Public site is brand register: fluid type, oxblood-committed, image-led. Admin is product register: fixed rem scale, one family, restrained colour, motion only where it conveys state.

### Imagery

The site renders a generated brand field ([brand-field.tsx](src/components/brand-field.tsx)) wherever CMS photography hasn't been uploaded. That's deliberate: shipping stock photos of strangers presented as this congregation would be a lie the design tells on the ministry's behalf, and a grey box would be worse design. Upload real photography at `/admin/media` and it disappears.

**Uploads go browser → Supabase Storage directly**, never through the app server. An 8 MB photo would otherwise hit the serverless request body limit and pay for the round trip twice. That means the [Storage policies](supabase/storage.sql) are the real gate on writing — this is the one path where RLS enforces rather than backstops, since Drizzle isn't involved at all.

The uploader reads intrinsic width and height before upload and stores them, so `next/image` can reserve space and the public site doesn't shift layout as photos load.

The `media` bucket is public, which is what lets the CDN cache and `next/image` optimise without signing every request. The tradeoff: an image attached to an *unpublished* draft is readable by anyone holding its URL. Paths are UUID-prefixed so they aren't enumerable, and `media_assets` still won't list them to the anon key — but if you ever need genuinely private files, use a separate bucket with signed URLs.

## Not built yet

Honest list of what's missing:

- **Reminder delivery.** The cron opens pledge windows and records that they're owed, but sending the email or SMS is a `TODO` in the route. Delivery is separated from state on purpose so a failing provider can't corrupt pledge records.
- **Remaining public pages.** `/community`, `/gatherings`, `/teaching`, `/partnership`, `/join` are linked from the nav but not yet built. Home, `/give`, and `/give/thank-you` are.
- **Receipts.** No email is sent after a successful gift.
- **Dashboard charts.** Monthly series query exists (`getMonthlySeries`); nothing renders it yet.
# Eden-Kindred
