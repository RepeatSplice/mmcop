import type { APIEmbed } from "discord.js"
import { monarchEmbed } from "../../lib/embeds.js"

export const CONNECT_PREFIX = "connect"
export const CONNECT_SERVICES_URL = "https://monarch-dayz.com/work-with-us"

const DISCIPLINES = [
  "Scripts",
  "GFX",
  "Imports",
  "Weapons & gear",
  "Branding",
  "VFX / promo",
  "Hosting ops",
].join("\n")

const FOOTER =
  "Open a **General Inquiry** ticket with your brief, or visit monarch-dayz.com/work-with-us for the full page."

function bullets(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n")
}

function tierEmbed(input: {
  title: string
  hours: string
  tagline: string
  included: string[]
  cta: string
}): APIEmbed {
  return monarchEmbed(
    input.title,
    [
      `**${input.hours}**`,
      "",
      input.tagline,
      "",
      "**Included**",
      bullets(input.included),
      "",
      "**Disciplines**",
      DISCIPLINES,
      "",
      input.cta,
      "",
      FOOTER,
    ].join("\n")
  )
}

export type ConnectSection = {
  value: string
  label: string
  description: string
}

export const CONNECT_SECTIONS: ConnectSection[] = [
  {
    value: "overview",
    label: "Work with us",
    description: "How Monarch partners with DayZ communities",
  },
  {
    value: "foundation",
    label: "Foundation retainer",
    description: "Up to 8 hrs / sprint",
  },
  {
    value: "partner",
    label: "Partner retainer",
    description: "Up to 12 hrs / sprint — most popular",
  },
  {
    value: "studio",
    label: "Studio retainer",
    description: "Up to 16 hrs / sprint",
  },
  {
    value: "custom",
    label: "Custom allocation",
    description: "Bespoke sprint hours and cadence",
  },
  {
    value: "why-retainer",
    label: "Why retainer works",
    description: "Studio relationship vs vendor queue",
  },
  {
    value: "weapons",
    label: "Weapons & loadouts",
    description: "One-off commissions",
  },
  {
    value: "gear",
    label: "Gear & clothing",
    description: "One-off commissions",
  },
  {
    value: "scripts",
    label: "Scripts & gameplay",
    description: "One-off commissions",
  },
  {
    value: "gfx",
    label: "GFX & skins",
    description: "One-off commissions",
  },
  {
    value: "imports",
    label: "Imports & retextures",
    description: "One-off commissions",
  },
  {
    value: "vfx",
    label: "VFX & media",
    description: "One-off commissions",
  },
  {
    value: "web",
    label: "Web development",
    description: "One-off commissions",
  },
  {
    value: "software",
    label: "Software development",
    description: "One-off commissions",
  },
  {
    value: "seo",
    label: "SEO & search",
    description: "One-off commissions",
  },
  {
    value: "paid-media",
    label: "Paid media & ads",
    description: "One-off commissions",
  },
  {
    value: "social",
    label: "Social media",
    description: "One-off commissions",
  },
  {
    value: "marketing",
    label: "Marketing & strategy",
    description: "One-off commissions",
  },
]

export function buildConnectSectionEmbeds(section: string): APIEmbed[] {
  switch (section) {
    case "overview":
      return [
        monarchEmbed(
          "Connect — Work with us",
          [
            "Long-term partnerships for communities that run like studios. One-off commissions for everything else.",
            "",
            "Monarch works with DayZ server owners the way a studio works with a publisher: on a defined cadence, with named leads, and with enough context about your economy and player base that we do not need re-briefing every season. Whether you want a long-term partner or a single deliverable, the standard is the same.",
            "",
            "We cover weapons, gear, scripts, GFX, imports, and server branding. One place, one team, one standard from first brief to live on your server.",
            "",
            "**Retainer partnerships** — fixed sprint allocation every two weeks. Work is planned ahead so you always know what ships before a wipe or patch window.",
            "",
            "**One-off commissions** — every deliverable available as a standalone scope. Open a ticket with your brief and we will come back with a quote.",
            "",
            "Sprint hours do not roll over. Scope unused hours at the start of each sprint. Need more than 12 hours? Get in touch and we will build a custom allocation.",
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "foundation":
      return [
        tierEmbed({
          title: "Foundation",
          hours: "Up to 8 hrs / sprint",
          tagline:
            "A consistent allocation every two weeks for communities building momentum. Covers all disciplines so your hours go where the server needs them most.",
          included: [
            "Up to 8 hours per sprint",
            "All disciplines available",
            "Dedicated point of contact",
            "Partner pricing on Monarch Software",
            "Priority over one-off clients",
            "Monthly review",
          ],
          cta: "**Start a conversation** — open a General Inquiry ticket with your server context and goals.",
        }),
      ]

    case "partner":
      return [
        tierEmbed({
          title: "Partner",
          hours: "Up to 12 hrs / sprint — Most popular",
          tagline:
            "Built for active communities with a release cadence. Twelve hours every two weeks across every discipline, with a named senior lead who knows your server.",
          included: [
            "Up to 12 hours per sprint across all disciplines",
            "Dedicated senior lead",
            "Monarch Software suite included",
            "Discount on all Monarch service add-ons",
            "Bi-weekly milestone check-ins",
            "First access to new releases",
          ],
          cta: "**Apply for partnership** — open a General Inquiry ticket with your release cadence and sprint needs.",
        }),
      ]

    case "studio":
      return [
        tierEmbed({
          title: "Studio",
          hours: "Up to 16 hrs / sprint",
          tagline:
            "A full studio allocation for communities running their server like a product with a roadmap, release calendar, and live player base that cannot afford downtime.",
          included: [
            "Up to 16 hours per sprint across all disciplines",
            "Dedicated dev and design leads",
            "Full Monarch Software suite included",
            "Maximum discount on all Monarch one-off services",
            "Weekly roadmap syncs",
            "Custom response window for critical fixes",
          ],
          cta: "**Let's build together** — open a General Inquiry ticket with your roadmap and team structure.",
        }),
      ]

    case "custom":
      return [
        tierEmbed({
          title: "Custom allocation",
          hours: "Your allocation — scoped per brief",
          tagline:
            "Not a clean fit with the tiers above? Tell us your sprint needs, disciplines, and budget. We will scope a custom allocation built around your server and release schedule.",
          included: [
            "Hours and cadence agreed per brief",
            "All disciplines available",
            "Full Monarch Software suite",
            "Dedicated leads across active disciplines",
            "SLA and response windows set at scoping",
            "Bespoke onboarding and kickoff",
          ],
          cta: "**Get in touch** — open a General Inquiry ticket describing hours, disciplines, and budget.",
        }),
      ]

    case "why-retainer":
      return [
        monarchEmbed(
          "Why retainer works",
          [
            "A studio relationship instead of a vendor queue.",
            "",
            "**01 — Sprint cadence**",
            "Every two weeks your allocation resets. Work is planned in advance so you always know what ships before a wipe or patch window.",
            "",
            "**02 — Flexible disciplines**",
            "Hours flex across scripts, GFX, imports, or weapons based on what your server needs that sprint. No rigid silos.",
            "",
            "**03 — Software included**",
            "Retainer partners get access to Monarch Software tools at partner pricing or included outright depending on tier.",
            "",
            "**04 — Single roof**",
            "One contact, one invoice, one team that already knows your server. No re-briefing a new vendor every season.",
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "weapons":
      return [
        monarchEmbed(
          "Weapons & loadouts",
          [
            "Individual weapon commissions and full weapons packs for DayZ servers.",
            "",
            bullets([
              "Individual weapon commissions",
              "Full weapons packs with ammo types",
              "Sniper and specialist platforms",
              "Weapon attachment sets (suppressors, stocks, scopes)",
              "Ammunition type integration (30MM, 20MM, .50AP, EMP and more)",
              "Weapons pack bundles at scale",
            ]),
            "",
            "One-off clients are served between sprint windows. Retainer partners receive priority scheduling. Lead times depend on current studio capacity and are confirmed at scoping.",
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "gear":
      return [
        monarchEmbed(
          "Gear & clothing",
          [
            bullets([
              "Individual clothing items",
              "Multi-item gear sets",
              "Full gear sets (vest, helmet, belt, pants, shirt, mask, shoes)",
              "Custom inventory slot configurations",
              "Vanilla clothing slot expansions",
              "Themed seasonal apparel",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "scripts":
      return [
        monarchEmbed(
          "Scripts & gameplay",
          [
            bullets([
              "Movement and locomotion overhauls",
              "Inventory and action overrides",
              "No weapon sway, jam, fog, or grass",
              "No unconscious, stun, or stun lock",
              "Building item resize (customisable per project)",
              "Vehicle and swimming inventory access",
              "LegMeta and advanced meta systems",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "gfx":
      return [
        monarchEmbed(
          "GFX & skins",
          [
            bullets([
              "Weapon skins: solid, glow, transparent, animated",
              "Clothing and gear skin design",
              "Server branding and identity systems",
              "Social and marketing graphics",
              "Season artwork and event banners",
              "In-game UI and HUD assets",
              "Logo, icon, and badge design",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "imports":
      return [
        monarchEmbed(
          "Imports & retextures",
          [
            bullets([
              "Storage imports",
              "Weapon imports",
              "Vest and helmet imports",
              "Collectable and sellable imports",
              "Attachment imports",
              "Multi-texture variants (5+ texture surcharge applies)",
              "Full retexture commissions",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "vfx":
      return [
        monarchEmbed(
          "VFX & media",
          [
            bullets([
              "Server trailers and season promos",
              "Wipe announcement videos",
              "Gameplay highlight edits",
              "Event coverage and recap reels",
              "Community content packages",
              "Animated overlays and stream assets",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "web":
      return [
        monarchEmbed(
          "Web development",
          [
            bullets([
              "Full website design and build",
              "Server community sites and landing pages",
              "Custom web applications and dashboards",
              "API integrations and backend services",
              "Headless CMS and content pipelines",
              "Performance, accessibility, and speed audits",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "software":
      return [
        monarchEmbed(
          "Software development",
          [
            bullets([
              "Game-to-web API bridges and live stat feeds",
              "Discord bots and automation",
              "Admin and player-facing panels",
              "Dedi utilities, PBO tooling, and build pipelines",
              "Custom tooling for server operators",
              "SaaS and subscription platform builds",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "seo":
      return [
        monarchEmbed(
          "SEO & search",
          [
            bullets([
              "Technical SEO audits and fixes",
              "On-page and content optimisation",
              "Keyword strategy and competitor analysis",
              "Structured data and schema markup",
              "Core Web Vitals and page speed work",
              "Local and international SEO",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "paid-media":
      return [
        monarchEmbed(
          "Paid media & ads",
          [
            bullets([
              "Google Search and Display campaigns",
              "YouTube advertising",
              "Meta (Facebook and Instagram) ads",
              "Campaign setup, copy, and creative",
              "Audience targeting and retargeting",
              "Ongoing management and reporting",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "social":
      return [
        monarchEmbed(
          "Social media",
          [
            bullets([
              "Profile setup and brand alignment",
              "Content calendar and post scheduling",
              "Community growth strategy",
              "Reel, short, and clip production",
              "Influencer and creator outreach",
              "Analytics and monthly reporting",
            ]),
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    case "marketing":
      return [
        monarchEmbed(
          "Marketing & strategy",
          [
            "The categories in this panel cover the most common requests, but they are not the limit. Monarch operates as a full-service digital studio: if it involves code, design, content, or marketing, we can scope it.",
            "",
            bullets([
              "Go-to-market planning for server launches",
              "Brand positioning and messaging",
              "Email marketing setup and campaigns",
              "Wipe and season launch campaigns",
              "Content marketing and editorial",
              "Full digital marketing retainers",
            ]),
            "",
            "If you have something in mind that does not fit a category here, open a General Inquiry ticket and describe it. We will tell you if it is something we can build.",
            "",
            FOOTER,
          ].join("\n")
        ),
      ]

    default:
      return [
        monarchEmbed(
          "Connect",
          ["That section was not found. Choose another topic from the panel menu.", "", FOOTER].join(
            "\n"
          )
        ),
      ]
  }
}
