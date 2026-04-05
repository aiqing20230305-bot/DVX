interface BatchAction {
  label: string
  onClick: () => void
  danger?: boolean
  icon?: React.ReactNode
}

interface BatchToolbarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  actions: BatchAction[]
}

export function BatchToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  actions
}: BatchToolbarProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminate
              }
            }}
            onChange={() => (isAllSelected ? onClearSelection() : onSelectAll())}
            className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm font-medium text-slate-300">全选</span>
        </label>
        <span className="text-sm text-slate-400">
          已选: <span className="font-medium text-slate-300">{selectedCount}</span> / {totalCount}
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                action.danger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
