'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function ChatDialog({ open, onOpenChange, children, className }: ChatDialogProps) {
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
    const touch = e.targetTouches[0]
    if (touch) setTouchStart(touch.clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0]
    if (touch) setTouchEnd(touch.clientX)
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

  // 点击背景关闭（移动端和桌面端都支持）
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* 背景点击区域 - 完全透明，无遮罩，仅用于点击关闭 */}
      <div
        className={cn(
          'fixed inset-0 z-[55]',
          // 完全透明，无遮罩效果
          // 只在桌面端启用点击关闭，移动端通过滑动关闭
          'hidden md:block',
        )}
        onClick={handleBackdropClick}
      />
      {/* 对话框 - 桌面端右下角，移动端全屏 */}
      <div
        ref={panelRef}
        className={cn(
          // 基础定位
          // z-index 低于气泡按钮（z-[70]），确保气泡按钮始终可见
          'fixed z-[60]',
          // 移动端：底部弹出，留边距显示背景
          'bottom-4 right-4 left-4 w-auto h-[85vh] max-h-[85vh]',
          // 桌面端：右下角定位，在气泡按钮上方（bottom-28 = 112px，气泡按钮 bottom-6 + h-16 = 88px）
          'md:bottom-28 md:right-6 md:left-auto md:w-[380px] md:h-[800px] md:max-h-[calc(100vh-7rem)]',
          // 布局
          'flex flex-col',
          // 样式
          'bg-white shadow-2xl',
          'rounded-2xl',
          // 动画：从右下角弹出（桌面端）或从右侧滑入（移动端）
          'transform transition-all duration-300 ease-out',
          'translate-x-0 translate-y-0',
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

