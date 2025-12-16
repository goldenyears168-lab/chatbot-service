'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function SidePanel({ open, onOpenChange, children, className }: SidePanelProps) {
  const [touchStart, setTouchStart] = React.useState<number | null>(null)
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  // 滑动关闭的最小距离（屏幕宽度的30%）
  const minSwipeDistance = React.useMemo(() => {
    if (typeof window === 'undefined') return 100
    return window.innerWidth * 0.3
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    const touch = e.targetTouches[0]; if (touch) setTouchStart(touch.clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0]; if (touch) setTouchEnd(touch.clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance

    if (isLeftSwipe) {
      onOpenChange(false)
    }
    
    setTouchStart(null)
    setTouchEnd(null)
  }

  // 点击背景关闭（仅在移动端全屏时）
  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只在移动端（全屏模式）且点击的是背景时关闭
    if (e.target === e.currentTarget && window.innerWidth < 640) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* 移动端：需要外层容器处理背景点击关闭（桌面端完全不需要） */}
      <div
        className={cn(
          'fixed inset-0 z-40',
          // 只在移动端显示（用于背景点击关闭）
          // 桌面端完全不渲染，确保背景完全可操作
          'block sm:hidden'
        )}
        onClick={handleBackdropClick}
      />
      {/* 侧边栏面板 - 桌面端只占右侧，不遮挡左侧 */}
      <div
        ref={panelRef}
        className={cn(
          // 基础定位和尺寸
          'fixed right-0 top-0',
          // z-index：足够高以显示在内容之上，但不会阻止背景交互
          // 因为只占右侧空间，左侧背景自然可操作
          'z-50',
          // 高度
          'h-[100dvh] sm:h-screen',
          // 宽度：移动端全屏，桌面端固定 420px（只占右侧，不遮挡左侧）
          'w-full sm:w-[420px]',
          // 布局
          'flex flex-col',
          // 样式
          'bg-white shadow-2xl',
          // 圆角：移动端无圆角，桌面端左侧圆角
          'rounded-none sm:rounded-l-2xl',
          // 动画：从右侧滑入
          'transform transition-transform duration-300 ease-out',
          'translate-x-0',
          // 移动端支持触摸滑动
          'touch-pan-y',
          className
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

interface SidePanelHeaderProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function SidePanelHeader({ children, onClose, className }: SidePanelHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between flex-shrink-0', className)}>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

SidePanelHeader.displayName = 'SidePanelHeader'

