import * as React from 'react'

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function TooltipTrigger({
  children,
  title,
}: {
  children: React.ReactElement<any, any>
  title: string
}) {
  return React.cloneElement(children, { title })
}

function TooltipContent({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
