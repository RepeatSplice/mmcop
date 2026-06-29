import { PrismaClient } from "../node_modules/.prisma/portal-client/index.js"

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_REVISION = "20260603001700_workspace_member_onboarded_v1"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaRevision?: string
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  if (cached && globalForPrisma.prismaRevision === PRISMA_CLIENT_REVISION) {
    return cached
  }

  if (cached) {
    void cached.$disconnect().catch(() => {})
  }

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
    globalForPrisma.prismaRevision = PRISMA_CLIENT_REVISION
  }
  return client
}

export const prisma = getPrisma()

