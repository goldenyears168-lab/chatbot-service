import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[var(--primary-500)] to-[var(--accent-purple-500)] text-white hover:shadow-[var(--shadow-lg)] hover:scale-[1.02] active:scale-[0.98] hover:from-[var(--primary-600)] hover:to-[var(--accent-purple-600)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 hover:shadow-[var(--shadow-md)] active:scale-[0.98]",
        outline:
          "border border-[var(--border-soft)] bg-[var(--surface-base)] hover:bg-[var(--neutral-50)] hover:border-[var(--primary-300)] hover:shadow-[var(--shadow-sm)] active:scale-[0.98]",
        secondary:
          "bg-[var(--neutral-100)] text-[var(--foreground)] hover:bg-[var(--neutral-200)] hover:shadow-[var(--shadow-sm)] active:scale-[0.98]",
        ghost: "hover:bg-[var(--neutral-100)] hover:text-[var(--foreground)] active:scale-[0.98]",
        link: "text-[var(--primary-600)] underline-offset-4 hover:underline hover:text-[var(--primary-700)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

