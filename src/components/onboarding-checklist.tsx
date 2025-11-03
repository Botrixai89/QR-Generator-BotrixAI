"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface OnboardingTask {
  id: string
  title: string
  description?: string
  completed: boolean
  actionUrl?: string
  actionLabel?: string
}

interface OnboardingChecklistProps {
  tasks: OnboardingTask[]
  title?: string
  description?: string
  onTaskComplete?: (taskId: string) => void
  onDismiss?: () => void
  showProgress?: boolean
  className?: string
}

export function OnboardingChecklist({
  tasks,
  title = "Getting Started",
  description = "Complete these steps to get the most out of your account",
  onTaskComplete,
  onDismiss,
  showProgress = true,
  className,
}: OnboardingChecklistProps) {
  const [localTasks, setLocalTasks] = useState(tasks)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const completedCount = localTasks.filter(t => t.completed).length
  const totalCount = localTasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleTaskToggle = (taskId: string) => {
    setLocalTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
    onTaskComplete?.(taskId)
  }

  const isAllCompleted = completedCount === totalCount

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isAllCompleted ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  All Set!
                </>
              ) : (
                title
              )}
            </CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
              aria-label="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showProgress && totalCount > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {totalCount} completed
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {localTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                task.completed
                  ? "bg-muted/50 border-muted"
                  : "bg-background border-border hover:border-primary/20"
              )}
            >
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={() => handleTaskToggle(task.id)}
                className="mt-0.5"
                aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
              />
              <label
                htmlFor={task.id}
                className={cn(
                  "flex-1 cursor-pointer",
                  task.completed && "text-muted-foreground"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className={cn(
                        "font-medium text-sm",
                        task.completed && "line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.actionUrl && !task.completed && (
                    <Link href={task.actionUrl}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.actionLabel || "Go"}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

