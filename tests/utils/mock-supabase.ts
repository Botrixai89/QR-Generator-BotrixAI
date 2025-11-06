/**
 * Mock Supabase client for testing
 */

export interface MockSupabaseClient {
  from: (table: string) => MockQueryBuilder
}

export interface MockQueryBuilder {
  select: (columns?: string | any, options?: any) => MockQueryBuilder
  insert: (data: any) => MockQueryBuilder
  update: (data: any) => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: (column: string, value: any) => MockQueryBuilder
  neq: (column: string, value: any) => MockQueryBuilder
  gt: (column: string, value: any) => MockQueryBuilder
  gte: (column: string, value: any) => MockQueryBuilder
  lt: (column: string, value: any) => MockQueryBuilder
  lte: (column: string, value: any) => MockQueryBuilder
  in: (column: string, values: any[]) => MockQueryBuilder
  like: (column: string, pattern: string) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder
  limit: (count: number) => MockQueryBuilder
  single: () => Promise<{ data: any; error: any }>
  then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => Promise<any>
  catch: (onRejected?: (reason: any) => any) => Promise<any>
  count?: number
}

export class MockSupabase implements MockSupabaseClient {
  public data: Record<string, any[]> = {}
  public error: any = null

  constructor(data?: Record<string, any[]>) {
    this.data = data || {}
  }

  setError(error: any) {
    this.error = error
    return this
  }

  setData(table: string, data: any[]) {
    this.data[table] = data
    return this
  }

  from(table: string): MockQueryBuilder {
    return new MockQueryBuilderImpl(this, table, this.data[table] || [])
  }
}

class MockQueryBuilderImpl implements MockQueryBuilder {
  private client: MockSupabase
  private table: string
  private data: any[]
  private filters: Array<{ type: string; column: string; value: any }> = []
  private selectedColumns?: string | any
  private selectOptions?: any
  private orderBy?: { column: string; ascending: boolean }
  private limitCount?: number

  constructor(client: MockSupabase, table: string, data: any[]) {
    this.client = client
    this.table = table
    this.data = [...data]
  }

  select(columns?: string | any, options?: any): MockQueryBuilder {
    this.selectedColumns = columns
    this.selectOptions = options
    
    // If select has count option, return immediately with count
    if (options?.count === 'exact' || options?.head === true) {
      const filtered = this.applyFilters(this.data)
      const result = { count: filtered.length, data: null, error: null }
      
      // Make it thenable
      return Object.assign(result, {
        then: (onFulfilled?: (value: any) => any) => {
          return Promise.resolve(result).then(onFulfilled)
        },
        catch: (onRejected?: (reason: any) => any) => {
          return Promise.resolve(result).catch(onRejected)
        },
      }) as any
    }
    
    return this
  }

  insert(data: any): MockQueryBuilder {
    if (this.client.error) {
      return this
    }
    const newItem = {
      id: `new-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.push(newItem)
    this.client.setData(this.table, this.data)
    return this
  }

  update(data: any): MockQueryBuilder {
    if (this.client.error) {
      return this
    }
    this.data = this.data.map(item => ({
      ...item,
      ...data,
      updatedAt: new Date().toISOString(),
    }))
    this.client.setData(this.table, this.data)
    return this
  }

  delete(): MockQueryBuilder {
    if (this.client.error) {
      return this
    }
    this.data = []
    this.client.setData(this.table, this.data)
    return this
  }

  eq(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'neq', column, value })
    return this
  }

  gt(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'gt', column, value })
    return this
  }

  gte(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'gte', column, value })
    return this
  }

  lt(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'lt', column, value })
    return this
  }

  lte(column: string, value: any): MockQueryBuilder {
    this.filters.push({ type: 'lte', column, value })
    return this
  }

  in(column: string, values: any[]): MockQueryBuilder {
    this.filters.push({ type: 'in', column, value: values })
    return this
  }

  like(column: string, pattern: string): MockQueryBuilder {
    this.filters.push({ type: 'like', column, value: pattern })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): MockQueryBuilder {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  limit(count: number): MockQueryBuilder {
    this.limitCount = count
    return this
  }

  async single(): Promise<{ data: any; error: any }> {
    if (this.client.error) {
      return { data: null, error: this.client.error }
    }

    let filtered = this.applyFilters(this.data)
    
    if (filtered.length === 0) {
      return { data: null, error: { message: 'Not found', code: 'PGRST116' } }
    }

    if (filtered.length > 1) {
      return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116' } }
    }

    return { data: filtered[0], error: null }
  }

  // Make the builder thenable so it can be awaited directly
  then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): Promise<any> {
    if (this.client.error) {
      const result = { data: null, error: this.client.error }
      return Promise.resolve(result).then(onFulfilled, onRejected)
    }

    let filtered = this.applyFilters(this.data)
    
    // If select has count option, return count
    if (this.selectOptions?.count === 'exact') {
      const result = { count: filtered.length, data: null, error: null }
      return Promise.resolve(result).then(onFulfilled, onRejected)
    }

    const result = { data: filtered, error: null }
    return Promise.resolve(result).then(onFulfilled, onRejected)
  }

  catch(onRejected?: (reason: any) => any): Promise<any> {
    return this.then(undefined, onRejected)
  }

  private applyFilters(data: any[]): any[] {
    let filtered = data

    for (const filter of this.filters) {
      filtered = filtered.filter(item => {
        switch (filter.type) {
          case 'eq':
            return item[filter.column] === filter.value
          case 'neq':
            return item[filter.column] !== filter.value
          case 'gt':
            return item[filter.column] > filter.value
          case 'gte':
            return item[filter.column] >= filter.value
          case 'lt':
            return item[filter.column] < filter.value
          case 'lte':
            return item[filter.column] <= filter.value
          case 'in':
            return filter.value.includes(item[filter.column])
          case 'like':
            const pattern = filter.value.replace(/%/g, '.*')
            return new RegExp(pattern).test(item[filter.column])
          default:
            return true
        }
      })
    }

    if (this.orderBy) {
      filtered.sort((a, b) => {
        const aVal = a[this.orderBy!.column]
        const bVal = b[this.orderBy!.column]
        if (this.orderBy!.ascending) {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        }
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      })
    }

    if (this.limitCount !== undefined) {
      filtered = filtered.slice(0, this.limitCount)
    }

    return filtered
  }
}

