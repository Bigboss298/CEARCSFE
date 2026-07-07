import * as React from 'react'
import { cn } from '@/lib/utils'

type DropdownMenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) throw new Error('DropdownMenu components must be used within <DropdownMenu />')
  return context
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  className,
  asChild = false,
}: {
  children: React.ReactElement<any, any>
  className?: string
  asChild?: boolean
}) {
  const { open, setOpen } = useDropdownMenuContext()

  if (!asChild) {
    return (
      <button
        type="button"
        className={className}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {children}
      </button>
    )
  }

  return React.cloneElement(children, {
    className: cn(children.props.className, className),
    'aria-expanded': open,
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event)
      if (!event.defaultPrevented) setOpen(!open)
    },
  })
}

function DropdownMenuContent({
  className,
  align = 'end',
  children,
}: {
  className?: string
  align?: 'start' | 'end'
  children: React.ReactNode
}) {
  const { open } = useDropdownMenuContext()

  if (!open) return null

  return (
    <div
      data-slot="dropdown-menu-content"
      className={cn(
        'absolute top-full z-50 mt-2 min-w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground', className)}>
      {children}
    </div>
  )
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-border', className)} />
}

function DropdownMenuItem({
  className,
  onSelect,
  children,
}: {
  className?: string
  onSelect?: () => void
  children: React.ReactNode
}) {
  const { setOpen } = useDropdownMenuContext()

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      onClick={() => {
        onSelect?.()
        setOpen(false)
      }}
    >
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
