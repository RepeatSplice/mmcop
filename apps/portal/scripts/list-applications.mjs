import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
try {
  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { email: true, name: true } } },
  })
  console.log(JSON.stringify(apps, null, 2))
  console.log("count:", apps.length)
} finally {
  await prisma.$disconnect()
}
