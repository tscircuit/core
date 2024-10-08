import type { AnyCircuitElement } from "circuit-json"
import { Circuit } from "lib/Circuit"
import { useEffect, useState } from "react"

export const useRenderedCircuit = (
  reactElements: React.ReactElement,
): {
  isLoading: boolean
  error?: Error | null
  circuit?: Circuit
  circuitJson?: AnyCircuitElement[]
} => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [circuit, setCircuit] = useState<Circuit>()
  const [circuitJson, setCircuitJson] = useState<AnyCircuitElement[]>()

  useEffect(() => {
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
