export async function postDiscordWebhook(args: { webhookUrl: string; content: string }) {
  try {
    const res = await fetch(args.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: args.content }),
    })
    if (!res.ok) return false
    return true
  } catch {
    return false
  }
}

export function isDiscordWebhookUrl(value: string) {
  return /^https:\/\/discord\.com\/api\/webhooks\//.test(value)
}

