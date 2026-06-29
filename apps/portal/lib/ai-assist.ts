import { aiEnabled } from "@/lib/portal-decisions"

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

async function chatCompletion(system: string, user: string): Promise<string | null> {
  if (!aiEnabled()) return null
  const key = process.env.OPENAI_API_KEY!
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 800,
        temperature: 0.4,
      }),
    })
    if (!res.ok) {
      console.warn("[ai] completion failed", await res.text().catch(() => ""))
      return null
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch (e) {
    console.warn("[ai] error", e)
    return null
  }
}

export async function generateSprintRecap(input: {
  workspaceName: string
  sprintName: string
  hoursUsed: number
  hoursMax: number
  completedTickets: Array<{ key: string; title: string }>
  activitySnippets: string[]
}): Promise<string | null> {
  const tickets = input.completedTickets.map((t) => `- ${t.key}: ${t.title}`).join("\n")
  const activity = input.activitySnippets.slice(0, 8).join("\n")
  return chatCompletion(
    "You write concise, client-friendly sprint recaps for a DayZ server retainer. No jargon. 2-4 short paragraphs.",
    `Workspace: ${input.workspaceName}\nSprint: ${input.sprintName}\nHours: ${input.hoursUsed}/${input.hoursMax}\nCompleted:\n${tickets || "(none)"}\nRecent activity:\n${activity || "(none)"}`
  )
}

export async function generateApplyTriageHint(input: {
  serverName: string
  desired: string
  description: string
}): Promise<string | null> {
  return chatCompletion(
    "You help ops staff triage DayZ server applications. Reply with 3-5 bullet points: risks, suggested next step, clarifying questions. Staff-only.",
    `Server: ${input.serverName}\nService: ${input.desired}\nNotes:\n${input.description.slice(0, 3000)}`
  )
}

export async function polishTicketText(input: {
  title: string
  description: string
}): Promise<{ title: string; description: string } | null> {
  const raw = await chatCompletion(
    "Improve ticket title and description for a DayZ modding team. Return JSON only: {\"title\":\"...\",\"description\":\"...\"}",
    `Title: ${input.title}\nDescription: ${input.description.slice(0, 4000)}`
  )
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { title?: string; description?: string }
    if (parsed.title && parsed.description) {
      return { title: parsed.title.slice(0, 200), description: parsed.description.slice(0, 8000) }
    }
  } catch {
    return null
  }
  return null
}

export async function summarizeChatThread(messages: string[]): Promise<string | null> {
  const body = messages.slice(-30).join("\n---\n").slice(0, 6000)
  return chatCompletion(
    "Summarize this workspace chat thread in 3-5 bullets for someone catching up. No names unless necessary.",
    body
  )
}
