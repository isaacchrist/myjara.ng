import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] touch-manipulation",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl active:from-emerald-700 active:to-teal-700 active:shadow-sm",
                destructive:
                    "bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700",
                outline:
                    "border-2 border-emerald-500 bg-transparent text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100",
                secondary:
                    "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
                ghost:
                    "hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
                link:
                    "text-emerald-600 underline-offset-4 hover:underline active:text-emerald-800",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-4 text-xs",
                lg: "h-12 rounded-lg px-8 text-base",
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
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
