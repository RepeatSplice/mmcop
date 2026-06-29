# Portal product decisions (defaults)

These defaults implement the roadmap open questions until changed.

| Topic | Decision |
|-------|----------|
| Monitoring | **MANUAL** + **CUSTOM_WEBHOOK** heartbeat (`SERVER_HEARTBEAT_SECRET`). Staff can edit status; agents POST to `/api/webhooks/server-heartbeat`. |
| Medusa link | Match **workspace owner email** to Medusa customer; optional `Workspace.medusaCustomerId` override. |
| Client tickets | **MEMBER+** may create tickets with `REQUESTED` status via `/workspace/[slug]/request`. VIEWER is read-only. |
| AI | **Optional cloud** when `OPENAI_API_KEY` is set; no auto-send of recaps without staff action. |
| Sprints | **Monday-aligned 2-week** windows; **3 slots** (1 ACTIVE + 2 PLANNING). Auto-advance when sprint ends; manual **End sprint** rolls incomplete tickets to next sprint as **To do** (`PLANNED`). Backlog = `sprintId` null; board = active sprint only (4 columns: To do → Done). |

Environment: see `.env.example` for `PORTAL_DEFAULT_CAL_URL`, `MEDUSA_*`, `OPENAI_*`, `SERVER_HEARTBEAT_SECRET`.
