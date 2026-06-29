export type TicketMember = {
  id: string
  name: string | null
  email: string | null
  role: string
}

export type TicketComment = {
  id: string
  authorId: string | null
  authorName: string
  body: string
  createdAt: string
}

export type TicketAttachment = {
  id: string
  fileName: string
  mimeType: string
  byteSize: number
  url: string
  createdAt: string
}

export type TicketSubtask = {
  id: string
  key: string
  title: string
  status: string
}

export type TicketSprint = {
  id: string
  name: string
  status: string
}

export type TicketDetailTicket = {
  id: string
  key: string
  type: string
  title: string
  description: string | null
  status: string
  discipline: string
  position: number
  hoursEst: number | null
  hoursActual: number | null
  parent: { id: string; key: string; title: string } | null
  subtaskOf: { id: string; key: string; title: string } | null
  sprint: { id: string; name: string; status: string } | null
  assignee: { id: string; name: string | null; email: string | null } | null
  createdBy: { id: string; name: string | null; email: string | null }
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export type TicketActivityEvent = {
  id: string
  type: string
  body: string
  createdAt: string
  actorName: string | null
}

export const DISCIPLINES = [
  "Scripts",
  "GFX",
  "Imports",
  "Weapons",
  "Branding",
  "VFX",
  "Hosting",
  "Other",
] as const
