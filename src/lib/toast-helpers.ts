/**
 * Enhanced Toast Utilities
 * Provides toasts with actionable links and better UX
 */

import { toast } from "sonner"
import type { ExternalToast } from "sonner"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions extends Omit<ExternalToast, "action"> {
  action?: ToastAction
  actionUrl?: string
  actionLabel?: string
  duration?: number
}

/**
 * Show success toast with optional action
 */
export function toastSuccess(
  message: string,
  options?: ToastOptions
): string | number {
  return toast.success(message, {
    ...options,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || "View",
          onClick: () => {
            if (options.actionUrl) {
              window.location.href = options.actionUrl
            }
          },
        }
      : options?.action,
    duration: options?.duration || 4000,
  })
}

/**
 * Show error toast with optional action
 */
export function toastError(
  message: string,
  options?: ToastOptions
): string | number {
  return toast.error(message, {
    ...options,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || "View",
          onClick: () => {
            if (options.actionUrl) {
              window.location.href = options.actionUrl
            }
          },
        }
      : options?.action,
    duration: options?.duration || 5000,
  })
}

/**
 * Show info toast with optional action
 */
export function toastInfo(
  message: string,
  options?: ToastOptions
): string | number {
  return toast.info(message, {
    ...options,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || "View",
          onClick: () => {
            if (options.actionUrl) {
              window.location.href = options.actionUrl
            }
          },
        }
      : options?.action,
    duration: options?.duration || 4000,
  })
}

/**
 * Show warning toast with optional action
 */
export function toastWarning(
  message: string,
  options?: ToastOptions
): string | number {
  return toast.warning(message, {
    ...options,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || "View",
          onClick: () => {
            if (options.actionUrl) {
              window.location.href = options.actionUrl
            }
          },
        }
      : options?.action,
    duration: options?.duration || 4000,
  })
}

/**
 * Show loading toast (returns ID for dismissing)
 */
export function toastLoading(message: string): string | number {
  return toast.loading(message, {
    duration: Infinity,
  })
}

/**
 * Update toast by ID
 */
export function updateToast(
  toastId: string | number,
  message: string,
  type: "success" | "error" | "info" | "warning" = "success",
  options?: ToastOptions
): void {
  toast[type](message, {
    ...options,
    id: toastId,
    action: options?.actionUrl
      ? {
          label: options.actionLabel || "View",
          onClick: () => {
            if (options.actionUrl) {
              window.location.href = options.actionUrl
            }
          },
        }
      : options?.action,
  })
}

/**
 * Dismiss toast by ID
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId)
}

/**
 * Promise toast - shows loading, then success/error
 */
export function toastPromise<T>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
    actionUrl,
    actionLabel,
  }: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
    actionUrl?: string
    actionLabel?: string
  }
): Promise<T> {
  return toast.promise(promise, {
    loading,
    success: (data) => {
      const message = typeof success === "function" ? success(data) : success
      return message
    },
    error: (err) => {
      const message = typeof error === "function" ? error(err) : error
      return message
    },
    action: actionUrl
      ? {
          label: actionLabel || "View",
          onClick: () => {
            window.location.href = actionUrl
          },
        }
      : undefined,
  })
}

