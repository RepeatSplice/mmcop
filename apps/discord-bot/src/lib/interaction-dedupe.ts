const seen = new Set<string>()
const MAX = 2000

export function isDuplicateInteraction(interactionId: string): boolean {
  if (seen.has(interactionId)) return true
  seen.add(interactionId)
  if (seen.size > MAX) {
    const drop = [...seen].slice(0, MAX / 2)
    for (const id of drop) seen.delete(id)
  }
  return false
}
