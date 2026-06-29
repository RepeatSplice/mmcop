export type TimelineTicket = {
  id: string
  key: string
  title: string
  status: string
  discipline: string
  dueDate: string | null
  assigneeName: string | null
}

export type TimelineSprint = {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  hoursMax: number
  hoursUsed: number
  tickets: TimelineTicket[]
}

export type TimelineZoom = 16 | 24 | 32
