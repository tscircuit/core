import { expect, test } from "bun:test"
import type { FanoutTracePath } from "@tscircuit/props"
import type { AutoroutingEndEvent } from "lib/events"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emitted branched trace paths replay each copper segment once", async () => {
  let solverCalls = 0
  const route = createBasicAutorouter(async (input) => {
    solverCalls++
    expect(input.connections).toHaveLength(1)
    const connection = input.connections[0]!
    expect(connection.pointsToConnect).toHaveLength(4)
    const [a, b, c, d] = connection.pointsToConnect
    const wire = (x: number, y: number) => ({
      route_type: "wire" as const,
      x,
      y,
      layer: "top" as const,
      width: 0.2,
    })
    const trace = (index: number, points: ReturnType<typeof wire>[]) => ({
      type: "pcb_trace" as const,
      pcb_trace_id: `branched_${index}`,
      connection_name: connection.name,
      route: points,
    })
    return [
      trace(0, [wire(a!.x, a!.y), wire(-1, 0)]),
      trace(1, [wire(b!.x, b!.y), wire(-1, 0)]),
      trace(2, [wire(-1, 0), wire(1, 0)]),
      trace(3, [wire(1, 0), wire(c!.x, c!.y)]),
      trace(4, [wire(1, 0), wire(d!.x, d!.y)]),
    ] satisfies SimplifiedPcbTrace[]
  })

  const board = (paths?: FanoutTracePath[]) => (
    <board width={20} height={16}>
      <net name="SIGNAL" routingPhaseIndex={0} />
      {[
        ["A", -6, 0],
        ["B", -3, -4],
        ["C", 6, 0],
        ["D", 3, 4],
      ].map(([name, x, y]) => (
        <chip
          key={name}
          name={name as string}
          pcbX={x as number}
          pcbY={y as number}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.6} height={0.6} shape="rect" />
            </footprint>
          }
        />
      ))}
      <trace from=".A > .pin1" to="net.SIGNAL" />
      <trace from=".B > .pin1" to="net.SIGNAL" />
      <trace from=".C > .pin1" to="net.SIGNAL" />
      <trace from=".D > .pin1" to="net.SIGNAL" />
      <autoroutingphase
        phaseIndex={0}
        {...(paths
          ? { pcbTracePaths: paths }
          : {
              autorouter: {
                local: true,
                groupMode: "subcircuit" as const,
                algorithmFn: route,
              },
            })}
      />
    </board>
  )

  const { circuit: original } = getTestFixture()
  let completed: AutoroutingEndEvent | undefined
  original.on("autorouting:end", (event) => {
    completed = structuredClone(event)
  })
  original.add(board())
  await original.renderUntilSettled()
  expect(original.db.pcb_autorouting_error.list()).toEqual([])
  expect(completed?.pcbTracePathsUnavailableReason).toBeUndefined()
  expect(completed?.pcbTracePaths).toHaveLength(5)
  expect(solverCalls).toBe(1)

  const { circuit: replay } = getTestFixture()
  replay.add(
    board(
      JSON.parse(JSON.stringify(completed!.pcbTracePaths)) as FanoutTracePath[],
    ),
  )
  await replay.renderUntilSettled()
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(solverCalls).toBe(1)
  const routes = (circuit: typeof original) =>
    circuit.db.pcb_trace.list().map((trace) => trace.route)
  expect(routes(replay)).toEqual(routes(original))
})
