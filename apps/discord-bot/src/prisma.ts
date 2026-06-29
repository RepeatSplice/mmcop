/**
 * Uses the Prisma client generated from apps/portal's schema.
 * Run `npm run prisma:generate:portal` from the repo root before building the bot.
 */
import { PrismaClient } from "../../portal/node_modules/.prisma/portal-client/index.js"

export const prisma = new PrismaClient()
