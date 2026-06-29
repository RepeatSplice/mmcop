const { PrismaClient } = require("@prisma/client")

async function main() {
  const prisma = new PrismaClient()
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT
        to_regclass('portal."Task"')::text  AS portal_task,
        to_regclass('public."Task"')::text  AS public_task,
        to_regclass('portal."Workspace"')::text AS portal_workspace,
        to_regclass('public."Workspace"')::text AS public_workspace
      ;`
    )
    console.log(JSON.stringify(rows, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e?.message ?? String(e))
  process.exitCode = 1
})

