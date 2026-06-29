# Discord Bot Architecture

Monarch's Discord bot combines **portal-driven workspace integration** with **guild automation** (auto-roles, UI sessions, slash commands).

## Folder layout

```
src/
├── index.ts                 # Entry — loads env, creates client, starts bot
├── config.ts                # Environment variables
├── prisma.ts                # Shared Prisma client (monarch-portal schema)
├── portal-inbound.ts        # Portal HTTP callback for inbound chat
│
├── bootstrap/
│   └── startup.ts           # Wire events, interactions, HTTP, login
│
├── client/
│   └── create-client.ts     # Discord.js client + intents
│
├── lib/
│   ├── embeds.ts            # Clean panel embed styling
│   ├── staff.ts             # Staff permission checks
│   └── guild-settings.ts    # Guild config DB helpers
│
├── discord/
│   ├── gateway.ts           # Chat sync (MessageCreate)
│   ├── events/              # Gateway event handlers
│   ├── commands/
│   │   ├── definitions.ts   # Slash command schemas
│   │   ├── deploy.ts        # REST deploy on ready
│   │   └── handlers/        # Per-command logic
│   └── interactions/
│       ├── router.ts        # InteractionCreate dispatcher
│       └── handlers/        # Button/select/modal handlers
│
├── features/
│   ├── auto-roles/          # Join, age, timed, connected roles
│   ├── ui-session/          # /ui member private channels
│   ├── captcha/             # Server verification gate
│   ├── rules/               # Server rules panel
│   ├── tickets/             # Support ticket panels + private channels
│   ├── connect/             # Connect services panel (retainers + commissions)
│   └── (workspace code in discord/ — migrate here over time)
│
└── http/
    ├── server.ts            # Express app (portal → bot API)
    └── auth.ts              # Internal bearer auth
```

## Adding a new slash command

1. Add builder in `discord/commands/definitions.ts`
2. Create handler in `discord/commands/handlers/your-command.ts`
3. Register in `discord/interactions/router.ts` `switch (interaction.commandName)`
4. Commands auto-deploy on bot ready

## Adding a new feature module

1. Create `features/your-feature/service.ts` for business logic
2. Add Prisma models in `monarch-portal/prisma/schema.prisma` if persistence needed
3. Run `npx prisma generate` in monarch-portal
4. Wire events in `discord/events/` or interactions in `discord/interactions/handlers/`

## Slash commands (staff)

| Command | Description |
|---------|-------------|
| `/autoroles` | Panel UI for join, age, timed, and connected role rules |
| `/ui member` | Open private 1:1 channel; strip roles, apply UI role |
| `/ui close` | Restore roles and delete UI channel |
| `/captcha setup` | One-time setup in verify channel; locks server until captcha passed |
| `/captcha refresh` | Repost verification panel |
| `/captcha resync` | Re-apply channel permission locks |
| `/captcha disable` | Turn off captcha for new joins |
| `/general-inquiry` | Post General Inquiry ticket panel (reason dropdown → modal → channel) |
| `/customer-support` | Post Customer Support ticket panel |
| `/order-ticket` | Post Order Support ticket panel |
| `/connect` | Post Connect services panel (browse retainers and one-off commissions) |

## Connect services

Staff run `/connect` once in a services channel. The panel includes a **Browse services** dropdown (18 sections: retainer tiers, why retainer, and one-off categories) plus a link to the full services page. Selections reply ephemerally with detailed Monarch embeds.

## Support tickets

Staff run one setup command per channel. Users pick a **reason** from the panel dropdown, complete a **modal** (subject + details; optional account name for support; required order ref for orders), and a private channel opens under **Support Tickets** with a staff role ping.

One open ticket per user. Staff close via the **Close ticket** button on the opening message (no slash close command).

## Required bot permissions

- Manage Roles, Manage Channels, View/Send Messages
- **Server Members Intent** enabled in Discord Developer Portal
