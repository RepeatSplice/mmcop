import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js"

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("autoroles")
    .setDescription("Configure automatic role assignment for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("ui")
    .setDescription("User intervention — private 1:1 staff channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("member")
        .setDescription("Open a private channel with a member (strips roles, applies UI role)")
        .addUserOption((opt) =>
          opt.setName("member").setDescription("Member to intervene with").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("reason").setDescription("Reason for the intervention").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close an open UI session and restore the member's roles")
        .addUserOption((opt) =>
          opt.setName("member").setDescription("Member whose session to close").setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("captcha")
    .setDescription("Server verification captcha — run setup once in your verify channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set up captcha in this channel (staff runs once)")
    )
    .addSubcommand((sub) =>
      sub.setName("refresh").setDescription("Post a new verification panel message")
    )
    .addSubcommand((sub) =>
      sub.setName("resync").setDescription("Re-apply channel locks for verified/unverified roles")
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable captcha (does not remove roles)")
    ),

  new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Monarch Modding server rules")
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View server rules")
    )
    .addSubcommand((sub) =>
      sub
        .setName("post")
        .setDescription("Post the rules panel in this channel (staff, run once)")
    )
    .addSubcommand((sub) =>
      sub
        .setName("refresh")
        .setDescription("Post a new rules panel message in this channel (staff)")
    ),

  new SlashCommandBuilder()
    .setName("general-inquiry")
    .setDescription("Post the General Inquiry support ticket panel in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("customer-support")
    .setDescription("Post the Customer Support ticket panel in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("order-ticket")
    .setDescription("Post the Order Support ticket panel in this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("connect")
    .setDescription("Post the Connect services panel (retainers and one-off commissions)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
]
