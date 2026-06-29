# Monarch Discord Bot

Guild automation + portal workspace integration: auto-roles, UI sessions, workspace channels, and two-way chat sync.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for folder layout and how to add commands/features.

## Setup

1. Copy `.env.example` to `.env` and fill values (same `DATABASE_URL` as monarch-portal).
2. In [Discord Developer Portal](https://discord.com/developers/applications), enable **Server Members Intent** for the bot.
3. From `monarch-portal`, run `npx prisma migrate deploy` (includes `20260605120000_discord_bot_automation`).
4. From `monarch-portal`, run `npx prisma generate`.
5. Install bot deps: `npm install` in this folder.
6. Create a **UI** role in Discord and set `DISCORD_UI_ROLE_ID` in `.env`.
7. Invite bot with permissions: **Manage Roles**, **Manage Channels**, View/Send Messages, Manage Permissions.

## Run

```bash
npm run dev
```

Slash commands (`/autoroles`, `/ui`) deploy automatically on startup.

HTTP API defaults to port **4100**. Set in monarch-portal:

- `DISCORD_BOT_URL=http://localhost:4100`
- `DISCORD_BOT_INTERNAL_SECRET=<same as bot>`

## Commands

| Command | Who | What |
|---------|-----|------|
| `/autoroles` | Staff | Panel for join, age, timed, and connected auto-roles |
| `/ui member @user reason` | Staff | Private 1:1 channel; strips member roles, applies UI role |
| `/ui close @user` | Staff | Restores roles and deletes UI channel |

## Portal env

Add to `monarch-portal/.env.local`:

```
DISCORD_BOT_URL=http://localhost:4100
DISCORD_BOT_INTERNAL_SECRET=your-long-random-secret
DISCORD_GUILD_ID=your-guild-snowflake
```

Bot `.env` needs matching `DISCORD_BOT_INTERNAL_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, and `DISCORD_UI_ROLE_ID`.
