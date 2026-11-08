# migrate-demo

A Cloudflare Worker that applies its database migrations to a [SuloBase](https://sulobase.com) project on every deploy, over HTTPS, with no direct database connection.

On each merge to `main`, Cloudflare Workers Builds runs:

```
node push-migrations.mjs && npx wrangler deploy
```

1. `push-migrations.mjs` sends every file in `supabase/migrations/` to your project's `migrate` Edge Function.
2. The function applies the ones it hasn't seen yet, all in one transaction, and records them in `supabase_migrations.schema_migrations` (the same table the Supabase CLI uses).
3. The Worker deploys only if that succeeded. A failed migration stops the deploy and leaves your database as it was.

## Use it in your own Worker

1. **Create the function.** In Studio, open **Edge Functions**, choose the template **Database Migrations from CI**, name it `migrate` and deploy it. In its settings, turn off **Verify JWT with legacy secret** and save.
2. **Copy two files** into your repository: `push-migrations.mjs` and your `supabase/migrations/` folder. Migration names start with a 14-digit timestamp, like `20261110090000_create_orders.sql`.
3. **Add two build variables** in Cloudflare (your Worker, **Settings → Build → Variables and secrets**):

   | Name | Value | Type |
   |---|---|---|
   | `SUPABASE_URL` | `https://yourproject.sulobase.com` | Text |
   | `SUPABASE_SECRET_KEY` | your project's secret key, `sb_secret_...` | Secret |

4. **Set the deploy command** to `node push-migrations.mjs && npx wrangler deploy`.

Never commit the secret key. It only goes in Cloudflare's encrypted build secrets.

## Try it from your computer first

```bash
SUPABASE_URL=https://yourproject.sulobase.com SUPABASE_SECRET_KEY=sb_secret_... node push-migrations.mjs --dry-run
```

`wouldApply` lists what would run. Drop `--dry-run` to apply.

## Rules worth knowing

- Never edit a migration that has run. Add a new file instead.
- Everything in one push runs in one transaction: all or nothing.
- Two builds at once are safe. The second waits for the first.
- `CREATE INDEX CONCURRENTLY` and `VACUUM` can't run inside a transaction. Run those once in Studio's SQL Editor.
