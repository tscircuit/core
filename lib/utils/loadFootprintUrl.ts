import { createComponentsFromCircuitJson } from "./createComponentsFromCircuitJson"
import type { LocalCacheEngine } from "../local-cache-engine"

export interface LoadFootprintUrlContext {
  cacheEngine?: LocalCacheEngine
  componentName?: string
  componentRotation?: number
  pinLabels?: Record<string, string | string[]>
}

/**
 * Loads footprint data from a URL, using cache if available
 */
export async function loadFootprintUrl(
  footprintUrl: string,
  ctx: LoadFootprintUrlContext,
) {
  const { cacheEngine, componentName, componentRotation, pinLabels } = ctx
  const cacheKey = `footprint:${footprintUrl}`

  let soup: any

  // Try to get from cache first
  if (cacheEngine) {
    try {
      const cached = await cacheEngine.getItem(cacheKey)
      if (cached) {
        try {
          soup = JSON.parse(cached)
        } catch {
          // If parsing fails, we'll fetch fresh
        }
      }
    } catch {
      // If cache read fails, continue to fetch
    }
  }

  // If not in cache, fetch from URL
  if (!soup) {
    const res = await fetch(footprintUrl)
    soup = await res.json()

    // Cache the result
    if (cacheEngine) {
      try {
        await cacheEngine.setItem(cacheKey, JSON.stringify(soup))
      } catch {
        // Ignore cache write errors
      }
    }
  }

  const fpComponents = createComponentsFromCircuitJson(
    {
      componentName: componentName ?? "",
      componentRotation: componentRotation?.toString() ?? "0",
      footprint: footprintUrl,
      pinLabels: pinLabels ?? {},
    },
    soup as any,
  )

  return fpComponents
}
