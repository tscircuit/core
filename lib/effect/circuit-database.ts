import * as Effect from "effect/Effect"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { createCircuitJsonDatabase } from "../utils/circuit-json/create-circuit-json-database"
import { CoreError, coreSync } from "./core-error"
import { CircuitEnvironment } from "./core-services"

/** Peer-version/indexed-table negotiation stays inside the external adapter. */
export const createCircuitDatabaseEffect = () =>
  coreSync(createCircuitJsonDatabase, "create_circuit_database")

export const circuitDatabaseEffect = Effect.gen(function* () {
  const environment = yield* CircuitEnvironment
  if (!environment.db) {
    return yield* Effect.fail(
      new CoreError(
        new Error("Circuit database is not available"),
        "circuit_database",
      ),
    )
  }
  return environment.db
})

/** Table schemas, ID allocation and geometry remain circuit-json-util's API. */
export function useCircuitDatabase<A>(
  operation: (db: CircuitJsonUtilObjects) => A,
) {
  return Effect.flatMap(circuitDatabaseEffect, (db) =>
    coreSync(() => operation(db), "circuit_database_operation"),
  )
}
