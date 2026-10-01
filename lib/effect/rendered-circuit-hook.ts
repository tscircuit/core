import type { AnyCircuitElement } from "circuit-json"
import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { coreSync } from "lib/effect/core-error"
import type React from "react"

/** The React mount owns its timer, circuit, jobs and resource finalizers. */
export const renderedCircuitHookEffect = (context: {
  reactElements: React.ReactElement
  onCircuit(circuit: RootCircuit): void
  onCircuitJson(circuitJson: AnyCircuitElement[]): void
  onRendered(): void
  createCircuit?: () => RootCircuit
}) =>
  Effect.scoped(
    Effect.gen(function* () {
      // Preserve the original deferred, one-millisecond public hook behavior.
      yield* Effect.sleep(1)
      const circuit = yield* Effect.acquireRelease(
        coreSync(
          () => context.createCircuit?.() ?? new RootCircuit(),
          "hook_circuit_create",
        ),
        (ownedCircuit) => Effect.orDie(ownedCircuit.disposeEffect()),
      )
      yield* coreSync(() => {
        circuit.add(context.reactElements)
        context.onCircuit(circuit)
        context.onCircuitJson(circuit.toJson())
        context.onRendered()
      }, "hook_circuit_render")
      // Keep the rendered circuit owned until dependency change or unmount.
      yield* Effect.never
    }),
  )
