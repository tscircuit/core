import type { AutorouterProp } from "@tscircuit/props"
import type { NormalizedAutorouterConfig } from "./getPresetAutoroutingConfig"

type AutorouterAlgorithmFn = NonNullable<
  NormalizedAutorouterConfig["algorithmFn"]
>
const cacheIdentities = new WeakMap<AutorouterAlgorithmFn, string>()
const followUpAutorouters = new WeakMap<AutorouterAlgorithmFn, AutorouterProp>()

/**
 * Opt a deterministic custom router into the platform's local routing cache.
 * The identity must change whenever its code, dependencies or captured options
 * change. The complete native routing input is also included in the cache key.
 * No identity is inferred from function text, which cannot identify closures.
 * Requires a configured platform.localCacheEngine; unwrapped functions continue
 * to bypass caching. For example: withAutorouterCache(createRouter, bundleHash).
 * An explicit followUpAutorouter uses the returned transformed SRJ as the next
 * native stage, preserving the accepted first stage and caching it separately.
 * Follow-up settings do not change the identity of the first-stage algorithm.
 */
export function withAutorouterCache(
  algorithmFn: AutorouterAlgorithmFn,
  cacheIdentity: string,
  options: { followUpAutorouter?: AutorouterProp } = {},
): AutorouterAlgorithmFn {
  if (!cacheIdentity.trim())
    throw new Error("A custom autorouter cache identity must not be empty.")
  const cachedAlgorithmFn: AutorouterAlgorithmFn = (input) => algorithmFn(input)
  cacheIdentities.set(cachedAlgorithmFn, cacheIdentity)
  if (options.followUpAutorouter !== undefined)
    followUpAutorouters.set(cachedAlgorithmFn, options.followUpAutorouter)
  return cachedAlgorithmFn
}

export const getCustomAutorouterCacheIdentity = (
  algorithmFn?: AutorouterAlgorithmFn,
) => (algorithmFn ? cacheIdentities.get(algorithmFn) : undefined)

/** Explicit opt-in only; an ordinary custom router continues to be final. */
export const getCustomAutorouterFollowUp = (
  algorithmFn?: AutorouterAlgorithmFn,
): AutorouterProp | undefined =>
  algorithmFn ? followUpAutorouters.get(algorithmFn) : undefined
