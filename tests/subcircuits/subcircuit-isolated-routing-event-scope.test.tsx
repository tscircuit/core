import { expect, test } from "bun:test"
import type {
  AutoroutingEndEvent,
  AutoroutingProgressEvent,
  AutoroutingStartEvent,
} from "lib/events"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sibling and nested isolated routing retain local IDs with distinct event scopes", async () => {
  const { circuit } = getTestFixture()
  const started = Promise.withResolvers<void>()
  const routers: ControllableAutorouter[] = []
  const starts: AutoroutingStartEvent[] = []
  const progress: AutoroutingProgressEvent[] = []
  const ends: AutoroutingEndEvent[] = []
  const algorithmFn = async (input: SimpleRouteJson) => {
    const router = new ControllableAutorouter(input)
    routers.push(router)
    router.onStart = () =>
      router.emit({ type: "progress", steps: 1, progress: 0.5 })
    return router
  }
  const routingGroup = (resistance: string) => (
    <group subcircuit autorouter={{ algorithmFn }}>
      <resistor name="R1" resistance={resistance} footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance={resistance} footprint="0402" pcbX={4} />
      <trace from="R1.pin1" to="R2.pin1" />
    </group>
  )
  circuit.on("autorouting:start", (event) => starts.push(event))
  circuit.on("autorouting:progress", (event) => {
    progress.push(event)
    if (progress.length === 2) started.resolve()
  })
  circuit.on("autorouting:end", (event) => ends.push(event))
  circuit.add(
    <board width={30} height={30}>
      <subcircuit name="S1" _subcircuitCachingEnabled>
        {routingGroup("1k")}
      </subcircuit>
      <subcircuit name="S2" _subcircuitCachingEnabled>
        <subcircuit name="Nested" _subcircuitCachingEnabled>
          {routingGroup("2k")}
        </subcircuit>
      </subcircuit>
    </board>,
  )

  const rendering = circuit.renderUntilSettled()
  await started.promise
  for (const router of routers) router.emit({ type: "complete", traces: [] })
  await rendering

  expect(starts).toHaveLength(2)
  expect(progress).toHaveLength(2)
  expect(ends).toHaveLength(2)
  expect(starts.map((event) => event.subcircuit_id)).toEqual([
    "subcircuit_source_group_0",
    "subcircuit_source_group_0",
  ])
  expect(
    starts.map((event) => event.isolatedSubcircuitPath?.length).sort(),
  ).toEqual([1, 2])
  expect(starts[0].isolatedSubcircuitPath?.[0]).not.toBe(
    starts[1].isolatedSubcircuitPath?.[0],
  )
  for (const start of starts) {
    const router = routers.find(
      (router) => router.input === start.simpleRouteJson,
    )
    expect(router).toBeDefined()
    const matchingProgress = progress.filter(
      (event) =>
        JSON.stringify(event.isolatedSubcircuitPath) ===
        JSON.stringify(start.isolatedSubcircuitPath),
    )
    const matchingEnd = ends.filter(
      (event) =>
        JSON.stringify(event.isolatedSubcircuitPath) ===
        JSON.stringify(start.isolatedSubcircuitPath),
    )
    expect(matchingProgress).toHaveLength(1)
    expect(matchingEnd).toHaveLength(1)
    expect(matchingProgress[0].subcircuit_id).toBe(start.subcircuit_id)
    expect(matchingEnd[0].subcircuit_id).toBe(start.subcircuit_id)
    expect(matchingEnd[0].simpleRouteJson.connections).toEqual(
      start.simpleRouteJson.connections,
    )
  }
})
