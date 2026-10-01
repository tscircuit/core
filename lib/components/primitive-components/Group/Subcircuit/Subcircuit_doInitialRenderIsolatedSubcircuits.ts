import * as Effect from "effect/Effect"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import { coreSync } from "lib/effect/core-error"
import {
  getSharedRenderRegistry,
  sharedRenderEffect,
} from "lib/effect/shared-render"
import type { ISubcircuit } from "./ISubcircuit"

/** Shared workers are owned by all consumers, rather than the first consumer. */
export function Subcircuit_doInitialRenderIsolatedSubcircuits(
  subcircuit: ISubcircuit,
): void {
  if (!subcircuit._isIsolatedSubcircuit || subcircuit._isolatedCircuitJson)
    return
  if (!subcircuit.getSubcircuitPropHash) return

  const propHash = subcircuit.getSubcircuitPropHash()
  const parentRoot = subcircuit.root!
  const { cachedSubcircuits, pendingSubcircuitRenders } = parentRoot
  const cached = cachedSubcircuits?.get(propHash)
  if (cached) {
    subcircuit._isolatedCircuitJson = cached
    subcircuit.children = []
    subcircuit._normalComponentNameMap = null
    return
  }

  const childrenToRender = [...subcircuit.children]
  subcircuit.children = []
  subcircuit._normalComponentNameMap = null

  const registry = getSharedRenderRegistry(
    pendingSubcircuitRenders ?? cachedSubcircuits ?? parentRoot,
  )
  subcircuit._queueEffect(
    "render-isolated-subcircuit",
    (job) =>
      Effect.gen(function* () {
        const circuitJson = yield* sharedRenderEffect({
          registry,
          addFinalizer: (finalizer) =>
            parentRoot.effectRuntime.addFinalizer(finalizer),
          request: {
            propHash,
            cachedSubcircuits,
            pendingSubcircuitRenders,
            render: () =>
              Effect.scoped(
                Effect.gen(function* () {
                  const isolatedCircuit = yield* Effect.acquireRelease(
                    coreSync(
                      () =>
                        new IsolatedCircuit({
                          platform: {
                            ...parentRoot.platform,
                            pcbDisabled: parentRoot.pcbDisabled,
                            schematicDisabled: parentRoot.schematicDisabled,
                          },
                          cachedSubcircuits,
                          pendingSubcircuitRenders,
                        }),
                      "subcircuit:create-child",
                    ),
                    (childCircuit) =>
                      Effect.promise(() => childCircuit.dispose()),
                  )
                  yield* coreSync(() => {
                    for (const child of childrenToRender)
                      isolatedCircuit.add(child)
                  }, "subcircuit:attach-children")
                  yield* isolatedCircuit.renderUntilSettledEffect()
                  return yield* coreSync(
                    () => isolatedCircuit.getCircuitJson(),
                    "subcircuit:extract-json",
                  )
                }),
              ),
          },
        })
        yield* coreSync(
          () =>
            job.commit(() => {
              subcircuit._isolatedCircuitJson = circuitJson
            }),
          "subcircuit:commit-json",
        )
      }),
    { propsChange: "finish" },
  )
}
