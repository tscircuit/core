import { expect, test } from "bun:test"
import * as Effect from "effect/Effect"
import {
  createCircuitDatabaseEffect,
  useCircuitDatabase,
} from "lib/effect/circuit-database"
import { CircuitEnvironment } from "lib/effect/core-services"
import { runCoreSync } from "lib/effect/core-error"

test("database service operations preserve table IDs and isolated database ownership", () => {
  const first = runCoreSync(createCircuitDatabaseEffect())
  const second = runCoreSync(createCircuitDatabaseEffect())
  const insert = useCircuitDatabase((db) =>
    db.source_component.insert({
      ftype: "simple_resistor",
      name: "R1",
      resistance: 1000,
    }),
  )
  const environment = { db: first, fetch: (url: string) => fetch(url) }
  const resistor = runCoreSync(
    Effect.provideService(insert, CircuitEnvironment, environment),
  )
  expect(first.source_component.get(resistor.source_component_id)).toEqual(
    resistor,
  )
  expect(second.toArray()).toEqual([])
  runCoreSync(
    Effect.provideService(
      useCircuitDatabase((db) =>
        db.source_component.update(resistor.source_component_id, {
          resistance: 2000,
        }),
      ),
      CircuitEnvironment,
      environment,
    ),
  )
  const updated = first.source_component.get(resistor.source_component_id)
  expect(updated?.ftype).toBe("simple_resistor")
  if (updated?.ftype === "simple_resistor")
    expect(updated.resistance).toBe(2000)
  expect(() =>
    runCoreSync(
      Effect.provideService(insert, CircuitEnvironment, {
        fetch: environment.fetch,
      }),
    ),
  ).toThrow("Circuit database is not available")
})
