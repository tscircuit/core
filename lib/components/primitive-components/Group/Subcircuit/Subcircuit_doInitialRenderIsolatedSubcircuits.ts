import type { AnyCircuitElement } from "circuit-json"
import { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { AutoroutingExecutionMetadata } from "lib/events"
import type { ISubcircuit } from "./ISubcircuit"

/**
 * Renders the subcircuit's children in isolation and extracts the circuit JSON.
 * If a cached result exists for the same prop hash, uses that instead.
 * If another subcircuit with the same props is already rendering, waits for that
 * render to complete instead of starting a duplicate render.
 *
 * Children of isolated subcircuits are not rendered by the parent circuit
 * (except for ReactSubtreesRender which creates component instances).
 * Instead, each isolated subcircuit creates its own IsolatedCircuit and
 * renders its children there, ensuring complete isolation.
 *
 * This function queues a single async effect that either:
 * 1. Waits for an existing pending render if one exists
 * 2. Performs the render and caches the result for others to use
 */
export function Subcircuit_doInitialRenderIsolatedSubcircuits(
  subcircuit: ISubcircuit,
): void {
  if (!subcircuit._isIsolatedSubcircuit) return

  // Skip if already has isolated circuit JSON
  if (subcircuit._isolatedCircuitJson) return

  if (!subcircuit.getSubcircuitPropHash) return

  const propHash = subcircuit.getSubcircuitPropHash()
  const cachedSubcircuits = subcircuit.root?.cachedSubcircuits
  const pendingSubcircuitRenders = subcircuit.root?.pendingSubcircuitRenders

  // Check cache first (synchronous - before async effect)
  const cached = cachedSubcircuits?.get(propHash)
  if (cached) {
    subcircuit._isolatedCircuitJson = cached
    subcircuit.children = []
    subcircuit._normalComponentNameMap = null
    return
  }

  // Capture children before clearing them
  const childrenToRender = [...subcircuit.children]

  // Clear children so they don't interfere with parent circuit
  subcircuit.children = []
  subcircuit._normalComponentNameMap = null

  const parentRoot = subcircuit.root!
  const signal = parentRoot._renderAbortSignal

  subcircuit._queueAsyncEffect("render-isolated-subcircuit", async () => {
    signal.throwIfAborted()
    // Check cache again (might have been populated while waiting to execute)
    const cachedResult = cachedSubcircuits?.get(propHash)
    if (cachedResult) {
      subcircuit._isolatedCircuitJson = cachedResult
      return
    }

    // Atomic check-and-set for pending render
    // This is safe because JavaScript is single-threaded within an event loop tick
    const pendingRenderPromise = pendingSubcircuitRenders?.get(propHash)
    if (pendingRenderPromise) {
      // Another subcircuit is already rendering - wait for it
      const circuitJson = await pendingRenderPromise
      signal.throwIfAborted()
      subcircuit._isolatedCircuitJson = circuitJson
      return
    }

    // We're the first - create promise and register it
    let resolveRender!: (json: AnyCircuitElement[]) => void
    let rejectRender!: (error: unknown) => void
    const renderPromise = new Promise<AnyCircuitElement[]>(
      (resolve, reject) => {
        resolveRender = resolve
        rejectRender = reject
      },
    )
    // The owning effect awaits the render below; the shared promise may have
    // no duplicate subscribers when cancellation rejects it.
    void renderPromise.catch(() => {})
    pendingSubcircuitRenders?.set(propHash, renderPromise)

    try {
      const isolatedCircuit = new IsolatedCircuit({
        platform: {
          ...parentRoot.platform,
          pcbDisabled: parentRoot.pcbDisabled,
          schematicDisabled: parentRoot.schematicDisabled,
        },
        cachedSubcircuits,
        pendingSubcircuitRenders,
      })

      const forwardedListeners = [
        "autorouting:start",
        "autorouting:progress",
        "autorouting:end",
        "autorouting:error",
        "solver:started",
        "solver:ended",
      ] as const
      const removeForwardedListeners = forwardedListeners.map((eventName) => {
        const listener = (event: AutoroutingExecutionMetadata) => {
          if (signal.aborted) return
          parentRoot.emit(eventName, {
            ...event,
            isolatedSubcircuitPath: [
              subcircuit._renderId,
              ...(event.isolatedSubcircuitPath ?? []),
            ],
          })
        }
        isolatedCircuit.on(eventName, listener)
        return () => isolatedCircuit.removeListener(eventName, listener)
      })

      for (const child of childrenToRender) {
        isolatedCircuit.add(child)
      }

      // Render until all async effects complete (including nested isolated subcircuits)
      try {
        await isolatedCircuit.renderUntilSettled({ signal })
      } finally {
        for (const removeListener of removeForwardedListeners) removeListener()
      }
      signal.throwIfAborted()

      const circuitJson = isolatedCircuit.getCircuitJson()

      // Store in cache for reuse by identical subcircuits
      cachedSubcircuits?.set(propHash, circuitJson)

      subcircuit._isolatedCircuitJson = circuitJson

      // Resolve the promise so waiting subcircuits can use the result
      resolveRender(circuitJson)
    } catch (error) {
      // Reject so waiting subcircuits don't hang forever
      rejectRender(error)
      throw error
    } finally {
      // Clean up the pending render entry
      pendingSubcircuitRenders?.delete(propHash)
    }
  })
}
