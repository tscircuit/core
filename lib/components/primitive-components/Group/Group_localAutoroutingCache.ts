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

type Translation = {
  x: number
  y: number
}

const roundCoordinate = (coordinate: number): number =>
  Math.round(coordinate * 1e6) / 1e6

const translatePoint = <T extends { x: number; y: number }>(
  point: T,
  translation: Translation,
): T => ({
  ...point,
  x: point.x + translation.x,
  y: point.y + translation.y,
})

const translateTrace = (
  trace: SimplifiedPcbTrace,
  translation: Translation,
): SimplifiedPcbTrace => ({
  ...trace,
  route: trace.route.map((routePoint) => {
    if (
      routePoint.route_type === "jumper" ||
      routePoint.route_type === "through_obstacle"
    ) {
      return {
        ...routePoint,
        start: translatePoint(routePoint.start, translation),
        end: translatePoint(routePoint.end, translation),
      }
    }

    return translatePoint(routePoint, translation)
  }),
})

const translateSimpleRouteJson = (
  simpleRouteJson: SimpleRouteJson,
  translation: Translation,
): SimpleRouteJson => ({
  ...simpleRouteJson,
  bounds: {
    minX: simpleRouteJson.bounds.minX + translation.x,
    maxX: simpleRouteJson.bounds.maxX + translation.x,
    minY: simpleRouteJson.bounds.minY + translation.y,
    maxY: simpleRouteJson.bounds.maxY + translation.y,
  },
  obstacles: simpleRouteJson.obstacles.map((obstacle) => ({
    ...obstacle,
    center: translatePoint(obstacle.center, translation),
  })),
  connections: simpleRouteJson.connections.map((connection) => ({
    ...connection,
    pointsToConnect: connection.pointsToConnect.map((point) =>
      translatePoint(point, translation),
    ),
  })),
  outline: simpleRouteJson.outline?.map((point) =>
    translatePoint(point, translation),
  ),
  traces: simpleRouteJson.traces?.map((trace) =>
    translateTrace(trace, translation),
  ),
  jumpers: simpleRouteJson.jumpers?.map((jumper) => ({
    ...jumper,
    center: translatePoint(jumper.center, translation),
    pads: jumper.pads.map((pad) => ({
      ...pad,
      center: translatePoint(pad.center, translation),
    })),
  })),
})

const getCacheSpaceSimpleRouteJson = (
  simpleRouteJson: SimpleRouteJson,
): SimpleRouteJson => {
  const translatedSimpleRouteJson = translateSimpleRouteJson(simpleRouteJson, {
    x: -simpleRouteJson.bounds.minX,
    y: -simpleRouteJson.bounds.minY,
  })

  return JSON.parse(
    JSON.stringify(translatedSimpleRouteJson, (_key, value) =>
      typeof value === "number" ? roundCoordinate(value) : value,
    ),
  )
}

export const getLocalAutoroutingCacheKey = (
  simpleRouteJson: SimpleRouteJson,
): string =>
  `routes:core@${pkgJson.version}:srj:${getSrjHash(
    getCacheSpaceSimpleRouteJson(simpleRouteJson),
  )}`

export const getCachedLocalAutoroutingPhaseResult = async ({
  cacheEngine,
  cacheKey,
  simpleRouteJson,
}: {
  cacheEngine: LocalCacheEngine | undefined
  cacheKey: string
  simpleRouteJson: SimpleRouteJson
}): Promise<CachedAutoroutingPhaseResult | null> => {
  if (!cacheEngine) return null

  try {
    const cachedResult = await cacheEngine.getItem(cacheKey)
    if (!cachedResult) return null

    const parsedResult = JSON.parse(cachedResult)
    if (!parsedResult || !Array.isArray(parsedResult.traces)) return null

    const translation = {
      x: simpleRouteJson.bounds.minX - parsedResult.bounds.minX,
      y: simpleRouteJson.bounds.minY - parsedResult.bounds.minY,
    }

    if (translation.x === 0 && translation.y === 0) {
      return parsedResult as CachedAutoroutingPhaseResult
    }

    return translateSimpleRouteJson(
      parsedResult,
      translation,
    ) as CachedAutoroutingPhaseResult
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
