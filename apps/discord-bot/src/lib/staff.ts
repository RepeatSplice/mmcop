import { PermissionFlagsBits, type GuildMember, type Interaction } from "discord.js"
import { config } from "../config.js"

export function isStaffMember(member: GuildMember | null | undefined): boolean {
  if (!member) return false
  if (member.permissions.has(PermissionFlagsBits.ManageRoles)) return true
  const staffRoleId = config.staffRoleId()
  if (staffRoleId && member.roles.cache.has(staffRoleId)) return true
  return false
}

export function requireStaff(interaction: Interaction): interaction is Interaction & {
  member: GuildMember
  guildId: string
} {
  if (!interaction.inGuild() || !interaction.guildId) return false
  const member = interaction.member as GuildMember | null
  return isStaffMember(member)
}
