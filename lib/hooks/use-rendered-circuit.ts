import type { AnyCircuitElement } from "circuit-json"
import { Circuit } from "lib/Circuit"
import React from "react"

export const useRenderedCircuit = (
  reactElements: React.ReactElement,
): {
  isLoading: boolean
  error?: Error | null
  circuit?: Circuit
  circuitJson?: AnyCircuitElement[]
} => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [circuit, setCircuit] = React.useState<Circuit>()
  const [circuitJson, setCircuitJson] = React.useState<AnyCircuitElement[]>()

  React.useEffect(() => {
    setIsLoading(true)
    setError(null)
    if (reactElements) {
      setTimeout(() => {
        try {
          const circuit = new Circuit()
          circuit.add(reactElements)

          setCircuit(circuit)
          setCircuitJson(circuit.toJson())
        } catch (error) {
          setError(error as Error)
        }

        setIsLoading(false)
      }, 1)
    }
  }, [reactElements])

  return { isLoading, error, circuit, circuitJson }
}
