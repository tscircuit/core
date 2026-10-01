import type { AnyCircuitElement } from "circuit-json"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import type { RootCircuit } from "lib/RootCircuit"
import { originalCoreError } from "lib/effect/core-error"
import { renderedCircuitHookEffect } from "lib/effect/rendered-circuit-hook"
import React from "react"

export const useRenderedCircuit = (
  reactElements: React.ReactElement,
): {
  isLoading: boolean
  error?: Error | null
  circuit?: RootCircuit
  circuitJson?: AnyCircuitElement[]
} => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [circuit, setCircuit] = React.useState<RootCircuit>()
  const [circuitJson, setCircuitJson] = React.useState<AnyCircuitElement[]>()

  React.useEffect(() => {
    setIsLoading(true)
    setError(null)
    if (!reactElements) return
    const mount = new AbortController()
    Effect.runCallback(
      renderedCircuitHookEffect({
        reactElements,
        onCircuit: setCircuit,
        onCircuitJson: setCircuitJson,
        onRendered: () => setIsLoading(false),
      }),
      {
        signal: mount.signal,
        onExit: (exit) => {
          if (Exit.isSuccess(exit) || Cause.hasInterruptsOnly(exit.cause))
            return
          const failure = originalCoreError(exit.cause)
          if (mount.signal.aborted) {
            console.error("Circuit hook cleanup failed", failure)
            return
          }
          setError(
            failure instanceof Error
              ? failure
              : new Error(String(failure), { cause: failure }),
          )
          setIsLoading(false)
        },
      },
    )
    return () => mount.abort()
  }, [reactElements])

  return { isLoading, error, circuit, circuitJson }
}
