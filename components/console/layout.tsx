import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

// Console Shell - Main page container
export interface ConsoleShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxWidth?: 'default' | 'wide' | 'full'
}

export const ConsoleShell = React.forwardRef<HTMLDivElement, ConsoleShellProps>(
  ({ className, maxWidth = 'default', children, ...props }, ref) => {
    const maxWidthClass = {
      default: 'max-w-6xl',
      wide: 'max-w-7xl',
      full: 'max-w-full',
    }[maxWidth]

    return (
      <div
        ref={ref}
        className={cn('container mx-auto px-4 sm:px-6 lg:px-8', maxWidthClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ConsoleShell.displayName = 'ConsoleShell'

// Console Section - Section with consistent spacing
export interface ConsoleSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  spacing?: 'tight' | 'default' | 'loose'
}

export const ConsoleSection = React.forwardRef<HTMLDivElement, ConsoleSectionProps>(
  ({ className, spacing = 'default', children, ...props }, ref) => {
    const spacingClass = {
      tight: 'space-y-4',
      default: 'space-y-6',
      loose: 'space-y-8',
    }[spacing]

    return (
      <div ref={ref} className={cn(spacingClass, className)} {...props}>
        {children}
      </div>
    )
  }
)
ConsoleSection.displayName = 'ConsoleSection'

// Console Card - Card with consistent padding
export interface ConsoleCardProps extends React.ComponentProps<typeof Card> {
  variant?: 'default' | 'code' | 'compact'
  children: React.ReactNode
}

export const ConsoleCard = React.forwardRef<HTMLDivElement, ConsoleCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const paddingClass = {
      default: 'p-4 md:p-6',
      code: 'p-3 md:p-4',
      compact: 'p-3',
    }[variant]

    return (
      <Card
        ref={ref}
        className={cn(
          'bg-[var(--surface-base)] border-[var(--border-subtle)] backdrop-blur-md',
          'hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-soft)]',
          paddingClass, 
          className
        )}
        {...props}
      >
        {children}
      </Card>
    )
  }
)
ConsoleCard.displayName = 'ConsoleCard'

// Console Grid - Grid layout for overview/detail pages
export interface ConsoleGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'overview' | 'detail' | 'three-col'
  columns?: number
}

export const ConsoleGrid = React.forwardRef<HTMLDivElement, ConsoleGridProps>(
  ({ className, variant = 'overview', columns, children, ...props }, ref) => {
    const gridClass = React.useMemo(() => {
      if (columns) {
        return `grid gap-4 md:grid-cols-${columns}`
      }
      switch (variant) {
        case 'overview':
          return 'grid gap-4 md:grid-cols-3'
        case 'detail':
          return 'grid gap-6 lg:grid-cols-[280px_1fr]'
        case 'three-col':
          return 'grid gap-6 lg:grid-cols-12'
        default:
          return 'grid gap-4'
      }
    }, [variant, columns])

    return (
      <div ref={ref} className={cn(gridClass, className)} {...props}>
        {children}
      </div>
    )
  }
)
ConsoleGrid.displayName = 'ConsoleGrid'

// Console Page - Page wrapper with padding
export interface ConsolePageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ConsolePage = React.forwardRef<HTMLDivElement, ConsolePageProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen py-8 md:py-10 relative z-10', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ConsolePage.displayName = 'ConsolePage'

// Console Header - Page header section
export interface ConsoleHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ConsoleHeader = React.forwardRef<HTMLDivElement, ConsoleHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md py-4',
          'shadow-[var(--shadow-xs)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ConsoleHeader.displayName = 'ConsoleHeader'

// Console Sidebar - Sidebar container
export interface ConsoleSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  sticky?: boolean
}

export const ConsoleSidebar = React.forwardRef<HTMLDivElement, ConsoleSidebarProps>(
  ({ className, sticky = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(sticky && 'sticky top-6', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ConsoleSidebar.displayName = 'ConsoleSidebar'

// Console Main - Main content area
export interface ConsoleMainProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ConsoleMain = React.forwardRef<HTMLDivElement, ConsoleMainProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {children}
      </div>
    )
  }
)
ConsoleMain.displayName = 'ConsoleMain'

