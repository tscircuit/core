import * as Effect from "effect/Effect"
import { corePromise, coreSync, runCorePromise } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import { readLocalCacheEffect } from "lib/local-cache-engine"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import type { AutorouterOptions } from "lib/utils/autorouting/CapacityMeshAutorouter"
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

const getJsonHash = (value: object): string => {
  const serializedValue = JSON.stringify(value)
  const hash1 = getFnv1aHash(serializedValue)
  const hash2 = getFnv1aHash(`${serializedValue}${hash1}`)
  return `${hash1.toString(16).padStart(8, "0")}${hash2
    .toString(16)
    .padStart(8, "0")}`
}

export type LocalAutoroutingCacheSolverOptions = Pick<
  AutorouterOptions,
  | "capacityDepth"
  | "targetMinCapacity"
  | "useAssignableSolver"
  | "useAutoJumperSolver"
  | "useLaserPrefabSolver"
  | "useTraceSimplificationSolver"
  | "autorouterVersion"
  | "effort"
> & {
  autorouterName: string
  solverName?: string
}

type CachedAutoroutingPhaseResult = SimpleRouteJson & {
  traces: SimplifiedPcbTrace[]
}

export const getLocalAutoroutingCacheKey = (
  simpleRouteJson: SimpleRouteJson,
  solverOptions: LocalAutoroutingCacheSolverOptions,
): string =>
  `routes:core@${pkgJson.version}:solver:${getJsonHash(solverOptions)}:srj:${getJsonHash(simpleRouteJson)}`

interface ReadAutoroutingCacheRequest {
  cacheEngine: LocalCacheEngine | undefined
  cacheKey: string
}

interface WriteAutoroutingCacheRequest extends ReadAutoroutingCacheRequest {
  result: CachedAutoroutingPhaseResult
  job?: CoreJobContext
}

export const getCachedLocalAutoroutingPhaseResultEffect = (
  request: ReadAutoroutingCacheRequest,
) =>
  Effect.gen(function* () {
    const cachedResult = yield* readLocalCacheEffect(request)
    if (!cachedResult) return null
    return yield* coreSync(() => {
      const parsedResult = JSON.parse(cachedResult)
      if (!parsedResult || !Array.isArray(parsedResult.traces)) return null
      return parsedResult as CachedAutoroutingPhaseResult
    }, "parse_local_autorouting_cache")
  }).pipe(
    // Typed cache/read/parse failures are optional-cache misses, as in the
    // baseline try/catch. This is not a recorder; defects/interruptions propagate.
    Effect.catch(() => Effect.succeed(null)),
  )

/** Existing Promise exports remain supported at the external boundary. */
export const getCachedLocalAutoroutingPhaseResult = (
  request: ReadAutoroutingCacheRequest,
): Promise<CachedAutoroutingPhaseResult | null> =>
  runCorePromise(getCachedLocalAutoroutingPhaseResultEffect(request))

export const cacheLocalAutoroutingPhaseResultEffect = (
  request: WriteAutoroutingCacheRequest,
) =>
  Effect.gen(function* () {
    if (!request.cacheEngine || (request.job && !request.job.isCurrent()))
      return
    const serializedResult = yield* coreSync(
      () => JSON.stringify(request.result),
      "serialize_local_autorouting_cache",
    )
    yield* corePromise(() => {
      const writeCache = () =>
        request.cacheEngine!.setItem(request.cacheKey, serializedResult)
      return Promise.resolve(
        request.job ? request.job.commit(writeCache) : writeCache(),
      )
    }, "write_local_autorouting_cache")
  }).pipe(
    // Preserve baseline best-effort writes by ignoring typed boundary failures.
    // This is not a recorder; defects/interruptions still propagate.
    Effect.catch(() => Effect.void),
  )

export const cacheLocalAutoroutingPhaseResult = (
  request: WriteAutoroutingCacheRequest,
): Promise<void> =>
  runCorePromise(cacheLocalAutoroutingPhaseResultEffect(request))
