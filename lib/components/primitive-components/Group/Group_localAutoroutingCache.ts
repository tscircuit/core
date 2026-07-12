import type { LocalCacheEngine } from "lib/local-cache-engine"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import pkgJson from "../../../../package.json"

const getFnv1aHash = (value: string): number => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const getSrjHash = (simpleRouteJson: SimpleRouteJson): string => {
  const serializedSrj = JSON.stringify(simpleRouteJson)
  const hash1 = getFnv1aHash(serializedSrj)
  const hash2 = getFnv1aHash(`${serializedSrj}${hash1}`)
  return `${hash1.toString(16).padStart(8, "0")}${hash2
    .toString(16)
    .padStart(8, "0")}`
}

type CachedAutoroutingPhaseResult = SimpleRouteJson & {
  traces: SimplifiedPcbTrace[]
}

export const getLocalAutoroutingCacheKey = (
  simpleRouteJson: SimpleRouteJson,
): string => `routes:core@${pkgJson.version}:srj:${getSrjHash(simpleRouteJson)}`

export const getCachedLocalAutoroutingPhaseResult = async ({
  cacheEngine,
  cacheKey,
}: {
  cacheEngine: LocalCacheEngine | undefined
  cacheKey: string
}): Promise<CachedAutoroutingPhaseResult | null> => {
  if (!cacheEngine) return null

  try {
    const cachedResult = await cacheEngine.getItem(cacheKey)
    if (!cachedResult) return null

    const parsedResult = JSON.parse(cachedResult)
    if (!parsedResult || !Array.isArray(parsedResult.traces)) return null

    return parsedResult as CachedAutoroutingPhaseResult
  } catch {
    return null
  }
}

export const cacheLocalAutoroutingPhaseResult = async ({
  cacheEngine,
  cacheKey,
  result,
}: {
  cacheEngine: LocalCacheEngine | undefined
  cacheKey: string
  result: CachedAutoroutingPhaseResult
}): Promise<void> => {
  if (!cacheEngine) return

  try {
    await cacheEngine.setItem(cacheKey, JSON.stringify(result))
  } catch {}
}
