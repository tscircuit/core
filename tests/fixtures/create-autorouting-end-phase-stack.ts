import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export function createAutoroutingEndPhaseStack(circuit: {
  on: (event: "autorouting:end", listener: (event: any) => void) => void
}) {
  const autoroutingEndPhaseStack: SimpleRouteJson[] = []

  circuit.on("autorouting:end", ({ srj, simpleRouteJson }) => {
    autoroutingEndPhaseStack.push(structuredClone(srj ?? simpleRouteJson))
  })

  return autoroutingEndPhaseStack
}
