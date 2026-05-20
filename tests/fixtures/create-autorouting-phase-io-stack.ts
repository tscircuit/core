import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export interface AutoroutingPhaseIo {
  subcircuit_id?: string | null
  componentDisplayName?: string
  startSimpleRouteJson?: SimpleRouteJson
  endSimpleRouteJson?: SimpleRouteJson
}

interface AutoroutingSimpleRouteJsonEvent {
  subcircuit_id?: string | null
  componentDisplayName?: string
  simpleRouteJson: SimpleRouteJson
}

export function createAutoroutingPhaseIoStack(circuit: {
  on(
    event: "autorouting:start",
    listener: (event: AutoroutingSimpleRouteJsonEvent) => void,
  ): void
  on(
    event: "autorouting:end",
    listener: (event: AutoroutingSimpleRouteJsonEvent) => void,
  ): void
}) {
  const autoroutingPhaseIoStack: AutoroutingPhaseIo[] = []

  circuit.on(
    "autorouting:start",
    ({ subcircuit_id, componentDisplayName, simpleRouteJson }) => {
      autoroutingPhaseIoStack.push({
        subcircuit_id,
        componentDisplayName,
        startSimpleRouteJson: structuredClone(simpleRouteJson),
      })
    },
  )

  circuit.on("autorouting:end", (event) => {
    const { subcircuit_id, componentDisplayName, simpleRouteJson } = event
    for (let i = autoroutingPhaseIoStack.length - 1; i >= 0; i--) {
      const phase = autoroutingPhaseIoStack[i]
      const isMatchingPhase =
        phase.subcircuit_id === subcircuit_id &&
        phase.componentDisplayName === componentDisplayName
      if (isMatchingPhase && !phase.endSimpleRouteJson) {
        phase.endSimpleRouteJson = structuredClone(simpleRouteJson)
        return
      }
    }

    autoroutingPhaseIoStack.push({
      subcircuit_id,
      componentDisplayName,
      endSimpleRouteJson: structuredClone(simpleRouteJson),
    })
  })

  return autoroutingPhaseIoStack
}
