export interface LocalCacheEngine {
  getItem(key: string): string | Promise<string | null> | null
  setItem(key: string, value: string): void | Promise<void>
  removeItem?(key: string): void | Promise<void>
}
