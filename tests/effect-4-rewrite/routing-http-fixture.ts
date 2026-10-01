import * as Effect from "effect/Effect"
import { RootCircuit } from "lib/RootCircuit"
import { Board } from "lib/components/normal-components/Board/Board"
import {
  CircuitEnvironment,
  CoreJobScope,
  type CircuitEnvironmentShape,
  type CoreJobContext,
  type CoreJobServices,
} from "lib/effect/core-services"

export function createHttpRoutingFixture(
  serverMode: "solve-endpoint" | "job" = "solve-endpoint",
) {
  const circuit = new RootCircuit()
  const board = new Board({
    width: 10,
    height: 10,
    autorouter: { serverUrl: "https://routing.test", serverMode, local: false },
  })
  circuit.add(board)
  circuit.pcbRoutingDisabled = true
  circuit.render()
  return { circuit, board }
}

export function provideRoutingServices<A, E>(
  program: Effect.Effect<A, E, CoreJobServices>,
  context: { job: CoreJobContext; fetch: CircuitEnvironmentShape["fetch"] },
) {
  return program.pipe(
    Effect.provideService(CircuitEnvironment, { fetch: context.fetch }),
    Effect.provideService(CoreJobScope, context.job),
    Effect.scoped,
  )
}
