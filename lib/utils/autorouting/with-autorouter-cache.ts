import type { NormalizedAutorouterConfig } from "./getPresetAutoroutingConfig"

type AutorouterAlgorithmFn = NonNullable<
  NormalizedAutorouterConfig["algorithmFn"]
>
const cacheIdentities = new WeakMap<AutorouterAlgorithmFn, string>()

/**
 * Opt a deterministic custom router into the platform's local routing cache.
 * The identity must change whenever its code, dependencies or captured options
 * change. The complete native routing input is also included in the cache key.
 * No identity is inferred from function text, which cannot identify closures.
 * Requires a configured platform.localCacheEngine; unwrapped functions continue
 * to bypass caching. For example: withAutorouterCache(createRouter, bundleHash).
 */
export function withAutorouterCache(
  algorithmFn: AutorouterAlgorithmFn,
  cacheIdentity: string,
): AutorouterAlgorithmFn {
  if (!cacheIdentity.trim())
    throw new Error("A custom autorouter cache identity must not be empty.")
  const cachedAlgorithmFn: AutorouterAlgorithmFn = (input) => algorithmFn(input)
  cacheIdentities.set(cachedAlgorithmFn, cacheIdentity)
  return cachedAlgorithmFn
}

export const getCustomAutorouterCacheIdentity = (
  algorithmFn?: AutorouterAlgorithmFn,
) => (algorithmFn ? cacheIdentities.get(algorithmFn) : undefined)
