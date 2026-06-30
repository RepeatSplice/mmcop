import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

function configured(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV !== "production" ? "dev-only-secret" : undefined),
  providers: [
    ...(configured(process.env.AUTH_DISCORD_ID) && configured(process.env.AUTH_DISCORD_SECRET)
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID!,
            clientSecret: process.env.AUTH_DISCORD_SECRET!,
            authorization: {
              params: { scope: "identify email guilds" },
            },
          }),
        ]
      : []),
    ...(configured(process.env.AUTH_GOOGLE_ID) && configured(process.env.AUTH_GOOGLE_SECRET)
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) (session.user as any).id = user.id
      return session
    },
  },
  events: {
    async linkAccount({ user, account }) {
      if (account.provider !== "discord" || !user.id) return
      const { prisma } = await import("@/lib/prisma")
      const { syncDiscordForAllUserWorkspaces } = await import("@/lib/discord-sync-user-workspaces")
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { discordUserId: account.providerAccountId },
        })
        void syncDiscordForAllUserWorkspaces(user.id)
      } catch (e) {
        console.warn("[auth] discordUserId link failed", e)
      }
      // Cross-schema link: populate public.User.customerId from site.Customer
      try {
        await prisma.$executeRaw`
          UPDATE "public"."User" u
          SET    "customerId" = c.id
          FROM   "site"."ConnectedAccount" ca
          JOIN   "site"."Customer" c ON c.id = ca."customerId"
          WHERE  ca.provider = 'discord'
          AND    ca."providerId" = ${account.providerAccountId}
          AND    u.id = ${user.id}
          AND    u."customerId" IS NULL
        `
      } catch (e) {
        console.warn("[auth] cross-schema customerId link failed", e)
      }
    },
    async signIn({ user, account }) {
      if (account?.provider === "discord" && user.id) {
        const { prisma } = await import("@/lib/prisma")
        const { syncDiscordForAllUserWorkspaces } = await import("@/lib/discord-sync-user-workspaces")
        await prisma.user
          .update({
            where: { id: user.id },
            data: { discordUserId: account.providerAccountId },
          })
          .catch(() => {})
        void syncDiscordForAllUserWorkspaces(user.id)
      }
    },
  },
})

