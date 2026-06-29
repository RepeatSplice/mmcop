export default function WorkspaceLoading() {
  return (
    <div className="animate-pulse space-y-0 divide-y divide-border min-h-[320px]">
      <div className="h-24 bg-surface-1" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-surface-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-md bg-surface-2" />
        ))}
      </div>
      <div className="h-48 bg-surface-1" />
    </div>
  )
}
