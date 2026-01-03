import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base shadow-sm transition-all duration-200",
                    "placeholder:text-gray-400",
                    "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
