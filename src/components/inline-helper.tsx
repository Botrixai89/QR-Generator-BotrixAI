"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InlineHelperProps {
  content: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
}

export function InlineHelper({
  content,
  className,
  side = "top",
  align = "center",
}: InlineHelperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "h-4 w-4 text-muted-foreground hover:text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-colors",
              className
            )}
            aria-label="More information"
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

