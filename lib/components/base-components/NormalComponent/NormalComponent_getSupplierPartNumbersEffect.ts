import type { PartsEngine, SupplierPartNumbers } from "@tscircuit/props"
import * as Effect from "effect/Effect"
import { corePromise, coreSync } from "lib/effect/core-error"
import type { CoreJobContext } from "lib/effect/core-services"
import { catchJobFailure } from "lib/effect/job-failure"
import { readLocalCacheEffect } from "lib/local-cache-engine"
import type { NormalComponent } from "./NormalComponent"

export function NormalComponent_getSupplierPartNumbersEffect(
  component: NormalComponent<any, any>,
  query: {
    partsEngine: PartsEngine
    sourceComponent: Parameters<PartsEngine["findPart"]>[0]["sourceComponent"]
    footprinterString?: string
    cacheKey: string
    job?: CoreJobContext
  },
) {
  return Effect.gen(function* () {
    if (component.props.doNotPlace) return {}
    const cacheEngine = component.root?.platform?.localCacheEngine
    const cached = yield* readLocalCacheEffect({
      cacheEngine,
      cacheKey: query.cacheKey,
    })
    if (cached) {
      const parsed = yield* coreSync(() => {
        try {
          return {
            hit: true as const,
            value: JSON.parse(cached) as SupplierPartNumbers,
          }
        } catch {
          return { hit: false as const }
        }
      }, "decode_parts_cache")
      if (parsed.hit) return parsed.value
    }
    // findPart has no AbortSignal parameter in the external PartsEngine contract.
    const result = yield* corePromise(
      () =>
        Promise.resolve(
          query.partsEngine.findPart({
            sourceComponent: query.sourceComponent,
            footprinterString: query.footprinterString,
          }),
        ),
      "find_supplier_part",
    )
    const supplierPartNumbers = yield* coreSync(() => {
      if (typeof result === "string") {
        const message = String(result)
        if (message.includes("<!DOCTYPE") || message.includes("<html")) {
          throw new Error(
            `Failed to fetch supplier part numbers: Received HTML response instead of JSON. Response starts with: ${message.substring(0, 100)}`,
          )
        }
        if (message === "Not found")
          throw new Error(
            `Part not found for ${component.getString()}${query.footprinterString ? ` with footprint "${query.footprinterString}"` : ""}`,
          )
        throw new Error(
          `Invalid supplier part numbers format: Expected object but got string: "${message}"`,
        )
      }
      if (!result || Array.isArray(result) || typeof result !== "object") {
        const actualType =
          result === null
            ? "null"
            : Array.isArray(result)
              ? "array"
              : typeof result
        throw new Error(
          `Invalid supplier part numbers format: Expected object but got ${actualType}`,
        )
      }
      return result
    }, "validate_supplier_parts")
    if (cacheEngine) {
      // Cache callbacks are noncooperative. Guard their start; no abandoned load
      // starts a cache write. An already-started write can finish after abort.
      yield* catchJobFailure(
        corePromise(
          () =>
            Promise.resolve(
              query.job
                ? query.job.commit(() =>
                    cacheEngine.setItem(
                      query.cacheKey,
                      JSON.stringify(supplierPartNumbers),
                    ),
                  )
                : cacheEngine.setItem(
                    query.cacheKey,
                    JSON.stringify(supplierPartNumbers),
                  ),
            ),
          "cache_supplier_parts",
        ),
        () => Effect.void,
      )
    }
    return supplierPartNumbers
  })
}
