import * as React from 'react'
import { cn } from '@/lib/utils'

const AvatarContext = React.createContext<{ sizeClass?: string } | null>(null)

function Avatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <AvatarContext.Provider value={{}}>
      <div
        data-slot="avatar"
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-secondary',
          className,
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
}

function AvatarImage({ className, alt, ...props }: React.ComponentProps<'img'>) {
  return (
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        'flex h-full w-full items-center justify-center bg-secondary text-sm font-semibold text-secondary-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
