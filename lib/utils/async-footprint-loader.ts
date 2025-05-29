import type { AnyCircuitElement } from "circuit-json"

interface FootprintCache {
  [url: string]: {
    promise: Promise<AnyCircuitElement[]>
    resolved?: AnyCircuitElement[]
    error?: Error
  }
}

/**
 * Cache for async footprint loading to prevent duplicate requests
 */
const footprintCache: FootprintCache = {}

/**
 * Determines if a footprint string is a URL
 */
export function isFootprintUrl(footprint: string): boolean {
  try {
    const url = new URL(footprint)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Loads footprint Circuit JSON from a URL with caching
 */
export async function loadFootprintFromUrl(url: string): Promise<AnyCircuitElement[]> {
  // Check if we already have this in cache
  if (footprintCache[url]) {
    const cached = footprintCache[url]
    if (cached.resolved) {
      return cached.resolved
    }
    if (cached.error) {
      throw cached.error
    }
    // Return the existing promise if still loading
    return cached.promise
  }

  // Create new cache entry
  const promise = fetchFootprintCircuitJson(url)
  footprintCache[url] = { promise }

  try {
    const result = await promise
    footprintCache[url].resolved = result
    return result
  } catch (error) {
    footprintCache[url].error = error as Error
    throw error
  }
}

/**
 * Fetches and validates Circuit JSON from a URL
 */
async function fetchFootprintCircuitJson(url: string): Promise<AnyCircuitElement[]> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch footprint from ${url}: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Validate that the response is an array of Circuit JSON elements
    if (!Array.isArray(data)) {
      throw new Error(`Invalid footprint response from ${url}: expected array of Circuit JSON elements`)
    }

    // Basic validation that elements have the expected structure
    for (const element of data) {
      if (!element || typeof element !== "object" || !element.type) {
        throw new Error(`Invalid Circuit JSON element in footprint from ${url}: missing type field`)
      }
    }

    return data as AnyCircuitElement[]
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error loading footprint from ${url}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Clears the footprint cache (useful for testing)
 */
export function clearFootprintCache(): void {
  Object.keys(footprintCache).forEach(key => {
    delete footprintCache[key]
  })
}

/**
 * Gets the current cache status for debugging
 */
export function getFootprintCacheStatus(): Record<string, "loading" | "resolved" | "error"> {
  const status: Record<string, "loading" | "resolved" | "error"> = {}
  
  for (const [url, cache] of Object.entries(footprintCache)) {
    if (cache.resolved) {
      status[url] = "resolved"
    } else if (cache.error) {
      status[url] = "error"
    } else {
      status[url] = "loading"
    }
  }
  
  return status
}