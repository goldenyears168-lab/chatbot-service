import * as React from 'react'
import { cn } from '@/lib/utils'

// Console H1 - Page title
export interface ConsoleH1Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export const ConsoleH1 = React.forwardRef<HTMLHeadingElement, ConsoleH1Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(
          'text-2xl md:text-3xl font-semibold tracking-tight text-foreground',
          className
        )}
        {...props}
      >
        {children}
      </h1>
    )
  }
)
ConsoleH1.displayName = 'ConsoleH1'

// Console H2 - Section title
export interface ConsoleH2Props extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export const ConsoleH2 = React.forwardRef<HTMLHeadingElement, ConsoleH2Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn('text-lg md:text-xl font-semibold text-foreground', className)}
        {...props}
      >
        {children}
      </h2>
    )
  }
)
ConsoleH2.displayName = 'ConsoleH2'

// Console Body - Description text
export interface ConsoleBodyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export const ConsoleBody = React.forwardRef<HTMLParagraphElement, ConsoleBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm md:text-[15px] text-muted-foreground', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
ConsoleBody.displayName = 'ConsoleBody'

// Console Meta - Metadata (time, version, etc.)
export interface ConsoleMetaProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export const ConsoleMeta = React.forwardRef<HTMLSpanElement, ConsoleMetaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn('text-xs text-muted-foreground', className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
ConsoleMeta.displayName = 'ConsoleMeta'

// Console Table Header - Table column headers
export interface ConsoleTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ConsoleTableHeader = React.forwardRef<HTMLDivElement, ConsoleTableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-xs uppercase tracking-wide text-muted-foreground font-medium',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ConsoleTableHeader.displayName = 'ConsoleTableHeader'

// Console Code Inline - Inline code snippets
export interface ConsoleCodeInlineProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const ConsoleCodeInline = React.forwardRef<HTMLElement, ConsoleCodeInlineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn('font-mono bg-muted px-1.5 py-0.5 rounded text-xs', className)}
        {...props}
      >
        {children}
      </code>
    )
  }
)
ConsoleCodeInline.displayName = 'ConsoleCodeInline'

// Console Kbd - Keyboard shortcuts
export interface ConsoleKbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const ConsoleKbd = React.forwardRef<HTMLElement, ConsoleKbdProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    )
  }
)
ConsoleKbd.displayName = 'ConsoleKbd'

