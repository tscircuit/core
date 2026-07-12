import type { LocalCacheEngine } from "lib/local-cache-engine"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import md5 from "js-md5"
import pkgJson from "../../../../package.json"

const getMd5Hash = md5 as unknown as (message: string) => string

type CachedAutoroutingPhaseResult = SimpleRouteJson & {
  traces: SimplifiedPcbTrace[]
}

export const getLocalAutoroutingCacheKey = (
  simpleRouteJson: SimpleRouteJson,
): string =>
  `core@${pkgJson.version}:srj:${getMd5Hash(JSON.stringify(simpleRouteJson))}`

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
