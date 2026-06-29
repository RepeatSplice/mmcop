## Monarch Portal (Standalone)

Standalone Next.js app for **retainer.monarchmodding.com** (client) and **admin.monarchmodding.com** (staff).

### Local dev

1. Copy env

```bash
cp .env.example .env.local
```

2. Ensure Postgres is running and `DATABASE_URL` points at `?schema=portal`

3. Run migrations + dev server

```bash
npm run prisma:migrate:deploy
npm run dev
```

App runs on `http://localhost:4000`.

### Deployment (Coolify)

- **Build**: via `Dockerfile`
- **Domains**:
  - `retainer.monarchmodding.com` → app root (client)
  - `admin.monarchmodding.com` → same container, `/ops` routes (staff)
- **Required env**:
  - `DATABASE_URL=... ?schema=portal`
  - `AUTH_SECRET`, `NEXTAUTH_URL` (or `AUTH_URL`)
  - OAuth provider secrets
  - Stripe + webhook secrets (if billing enabled)

### Webhooks

- **GitHub**: `POST /api/webhooks/github`
- **Discord ingest**: `POST /api/webhooks/discord` (Bearer `DISCORD_INGEST_TOKEN`)
- **Stripe**: `POST /api/webhooks/stripe`

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
