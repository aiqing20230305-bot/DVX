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
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[calc(100%-48px)] flex items-center justify-between p-4 border rounded-lg shadow-lg transition-all duration-300"
      style={{
        bottom: selectedCount > 0 ? '24px' : '-100px', // 有选中项时显示，否则隐藏到底部外
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: 'var(--color-bg-base)',
        opacity: selectedCount > 0 ? 0.98 : 0,
        borderColor: 'var(--color-border)'
      }}
    >
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
            className="w-4 h-4 rounded border-[#E3E5E8] text-[#3370FF] focus:ring-[#3370FF] focus:ring-offset-[#FFFFFF]"
          />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>全选</span>
        </label>
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          已选: <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{selectedCount}</span> / {totalCount}
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
                  : 'bg-[#3370FF] hover:bg-[#1E4FD9] text-white'
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
