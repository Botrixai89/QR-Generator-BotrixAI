/**
 * Optimistic UI Utilities
 * Helps implement optimistic updates for better UX
 */

export interface OptimisticUpdate<T> {
  optimistic: T
  rollback: () => void
  commit: (final: T) => void
}

/**
 * Create optimistic update helper
 */
export function createOptimisticUpdate<T>(
  current: T,
  optimistic: Partial<T>,
  onUpdate: (data: T) => Promise<T>,
  onRollback?: (data: T) => void
): OptimisticUpdate<T> {
  const previous = { ...current }
  const optimisticData = { ...current, ...optimistic }

  return {
    optimistic: optimisticData as T,
    rollback: () => {
      if (onRollback) {
        onRollback(previous)
      }
    },
    commit: () => {
      // Update successful
    },
  }
}

/**
 * Execute optimistic update with error handling
 */
export async function executeOptimisticUpdate<T>(
  updateFn: () => Promise<T>,
  optimistic: T,
  setState: (value: T) => void,
  onError?: (error: Error) => void
): Promise<T | null> {
  // Apply optimistic update
  setState(optimistic)

  try {
    // Execute actual update
    const result = await updateFn()
    // Commit final state
    setState(result)
    return result
  } catch (error) {
    // Rollback on error
    if (onError) {
      onError(error as Error)
    }
    return null
  }
}

/**
 * Batch optimistic updates
 */
export class OptimisticBatch<T> {
  private updates: Map<string, { optimistic: T; previous: T }> = new Map()
  private commitFn?: (data: T[]) => Promise<T[]>
  private rollbackFn?: (previous: T[]) => void

  constructor(
    commitFn?: (data: T[]) => Promise<T[]>,
    rollbackFn?: (previous: T[]) => void
  ) {
    this.commitFn = commitFn
    this.rollbackFn = rollbackFn
  }

  add(id: string, optimistic: T, previous: T): void {
    this.updates.set(id, { optimistic, previous })
  }

  remove(id: string): void {
    this.updates.delete(id)
  }

  getOptimistic(id: string): T | undefined {
    return this.updates.get(id)?.optimistic
  }

  getAllOptimistic(): T[] {
    return Array.from(this.updates.values()).map(u => u.optimistic)
  }

  async commit(): Promise<T[] | null> {
    const optimisticData = this.getAllOptimistic()

    try {
      if (this.commitFn) {
        const result = await this.commitFn(optimisticData)
        this.updates.clear()
        return result
      }
      return optimisticData
    } catch (error) {
      this.rollback()
      throw error
    }
  }

  rollback(): void {
    if (this.rollbackFn) {
      const previousData = Array.from(this.updates.values()).map(u => u.previous)
      this.rollbackFn(previousData)
    }
    this.updates.clear()
  }
}

