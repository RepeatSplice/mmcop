export type ListSprintLite = { id: string; name: string; status: string }

export type ListItemType = "TICKET" | "EPIC"

export type ListTypeFilter = "tickets" | "epics" | "all"

export type ListLaneFilter = "all" | "workflow" | "billing"

export type ListMember = {
  id: string
  name: string | null
  email: string | null
}

export type ListTicketRow = {
  id: string
  key: string
  title: string
  itemType: ListItemType
  status: string
  discipline: string
  position: number
  dueDate: string | null
  updatedAt: string
  sprint: ListSprintLite | null
  assigneeId: string | null
  assigneeName: string | null
  assigneeImage: string | null
  childCount: number
  subtaskOfId: string | null
  subtaskOfKey: string | null
  parentEpicId: string | null
  parentEpicKey: string | null
}

export type ListSortKey =
  | "key"
  | "title"
  | "itemType"
  | "status"
  | "assignee"
  | "discipline"
  | "sprint"
  | "position"
  | "dueDate"
  | "updatedAt"
  | "parent"

export type ListStatusFilter = "all" | string
