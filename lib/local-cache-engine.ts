export interface LocalCacheEngine {
  getItem(key: string): string | Promise<string | null> | null
  setItem(key: string, value: string): void | Promise<void>
  removeItem?(key: string): void | Promise<void>
  /**
   * Identifies the code behind a custom autorouter algorithmFn so its results
   * can be cached. Return a filename-safe string that changes whenever the
   * algorithm's code changes, or null when the function cannot be identified.
   * Without this method custom algorithm results are not cached.
   */
  getAlgorithmFnFingerprint?(
    algorithmFn: Function,
  ): string | null | Promise<string | null>
}
