"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSize = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }[size]

  const titleSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size]

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        {icon && (
          <div className={cn("text-muted-foreground mb-4", iconSize)}>
            {icon}
          </div>
        )}
        <h3 className={cn("font-semibold text-foreground mb-2", titleSize)}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex gap-3">
            {action && (
              <Button onClick={action.onClick} size={size === "lg" ? "lg" : "default"}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                variant="outline" 
                onClick={secondaryAction.onClick}
                size={size === "lg" ? "lg" : "default"}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

