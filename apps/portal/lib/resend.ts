import { Resend } from "resend"

export function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendEmail(args: {
  to: string
  subject: string
  text: string
}) {
  const resend = getResend()
  const from = process.env.RESEND_FROM
  if (!resend || !from) return

  try {
    await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      text: args.text,
    })
  } catch {
    // Best-effort in-app notifications are the source of truth
  }
}

