# Monarch — monorepo

npm workspaces monorepo containing three apps that share a single git repository.

| App | Directory | Tech | Domain |
|-----|-----------|------|--------|
| Marketing site | _(root)_ | Astro SSR + Prisma (mmcop DB) | `monarch-dayz.com` |
| Staff admin panel | _(root, same Astro app)_ | Astro SSR | `admin.monarch-dayz.com` |
| Retainer portal | `apps/portal` | Next.js 15 + Prisma (portal DB) | `portal.monarch-dayz.com` |
| Discord bot | `apps/discord-bot` | discord.js 14 + Express | internal (no public URL) |

> The marketing site and admin panel are **the same Astro service** bound to two domains in Coolify. The middleware enforces that `/manage` is only reachable on `admin.monarch-dayz.com`; all other routes are only reachable on the main domain. Set `ADMIN_HOST=admin.monarch-dayz.com` in the Coolify env to activate this. Leave it blank in local dev to access `/manage` on `localhost:4321` as normal.

Each app has its **own database**. The Astro site and portal share no schema; the bot connects to the portal DB.

---

## Quick start (local)

```sh
# Install all workspaces from the repo root
npm install

# ── Astro marketing site ──────────────────────────────
cp .env.example .env          # fill in mmcop DATABASE_URL
npm run db:migrate:dev        # run Astro/mmcop migrations
npm run db:seed
npm run dev                   # http://localhost:4321

# ── Portal (Next.js) ─────────────────────────────────
cp apps/portal/.env.example apps/portal/.env   # fill in portal DATABASE_URL
npm run prisma:generate:portal                 # generate isolated Prisma client
npm run dev:portal            # http://localhost:4000  (or whatever PORT is set)

# ── Discord bot ───────────────────────────────────────
cp apps/discord-bot/.env.example apps/discord-bot/.env
npm run dev:bot               # tsx watch
```

- Astro site: `http://localhost:4321`
- Astro admin: `http://localhost:4321/manage` (local — `ADMIN_HOST` is blank so no redirect)
- Portal: `http://localhost:4000`

---

## Root commands

| Command | Action |
|---------|--------|
| `npm run dev` | Astro dev server |
| `npm run build` | Build Astro site (`prisma generate` + Astro) |
| `npm run start` | Run Astro production server |
| `npm run db:migrate` | Apply mmcop DB migrations (deploy) |
| `npm run db:migrate:dev` | Create/apply mmcop migrations (local) |
| `npm run db:seed` | Seed mmcop DB |
| `npm run db:studio` | Prisma Studio (mmcop DB) |
| `npm run prisma:generate:portal` | Re-generate isolated portal Prisma client |
| `npm run dev:portal` | Start portal dev server |
| `npm run build:portal` | Build portal for production |
| `npm run dev:bot` | Start Discord bot in watch mode |
| `npm run build:bot` | Compile bot TypeScript |

---

## Prisma isolation

Both the Astro root and `apps/portal` depend on `@prisma/client`. To avoid the two generated clients overwriting each other when npm hoists packages, the portal schema sets a **custom output path**:

```prisma
# apps/portal/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/portal-client"
}
```

The portal's `lib/prisma.ts` and the bot's `src/prisma.ts` both import from this isolated path. Always run `npm run prisma:generate:portal` after changing the portal schema.

---

## Deployment

See [docs/coolify-deploy.md](docs/coolify-deploy.md) for Coolify VPS setup. Deploy each app as a separate Coolify service pointed at the same repo, with the appropriate `NIXPACKS_BUILD_CMD` / start command and its own `DATABASE_URL`.
