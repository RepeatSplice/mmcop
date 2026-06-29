import { PrismaClient } from "@prisma/client"

const email = process.argv[2] ?? "benpope130@gmail.com"
const prisma = new PrismaClient()
try {
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      staffProfile: true,
      workspaceMembers: { include: { workspace: true } },
      applications: { orderBy: { createdAt: "desc" } },
    },
  })
  console.log(JSON.stringify(user, null, 2))
} finally {
  await prisma.$disconnect()
}
