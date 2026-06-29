import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type APIEmbed,
} from "discord.js"
import { monarchEmbed } from "../../lib/embeds.js"

const PREFIX = "captcha"

export type CaptchaPanelPayload = {
  embeds: APIEmbed[]
  components: ActionRowBuilder<ButtonBuilder>[]
}

const WELCOME_COPY = [
  "Welcome to the **Monarch Modding** Discord server.",
  "",
  "Read **Monarch Modding — Server Rules** in the rules channel before verifying. By completing verification you agree to all server rules and policies.",
  "",
  "**Monarch Modding Server Verification**",
  "1. Click **Verify I'm Human**",
  "2. Read the captcha code shown only to you",
  "3. Enter the letters and numbers exactly as displayed",
  "",
  "Once verified you will receive access to the full server.",
].join("\n")

export function buildCaptchaSetupPanel(): CaptchaPanelPayload {
  return {
    embeds: [monarchEmbed("Server Verification", WELCOME_COPY)],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`${PREFIX}:start`)
          .setLabel("Verify I'm Human")
          .setStyle(ButtonStyle.Success)
      ),
    ],
  }
}

export function buildCaptchaChallengePanel(captchaVisual: string): CaptchaPanelPayload {
  return {
    embeds: [
      monarchEmbed(
        "Enter Captcha",
        [
          "Complete your **Server Verification** to unlock Monarch Modding channels.",
          "",
          "Type the characters you see below. Ignore decorative symbols — enter only the **letters and numbers**.",
          "",
          captchaVisual,
          "",
          "You have **3 attempts**. This code expires in **5 minutes**.",
        ].join("\n")
      ),
    ],
    components: [],
  }
}

export const CAPTCHA_PREFIX = PREFIX
