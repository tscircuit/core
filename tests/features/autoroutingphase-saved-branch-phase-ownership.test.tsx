import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("implicit saved net selection preserves explicitly assigned same-net phases", async () => {
  const { circuit } = getTestFixture()
  const starts: AutoroutingStartEvent[] = []
  circuit.on("autorouting:start", (event) => starts.push(event))
  const wire = (x: number, y: number) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.25,
    layer: "top" as const,
  })
  circuit.add(
    <board width={16} height={12} routeRemaining={false}>
      {[
        { name: "A", x: -5, y: 0 },
        { name: "B", x: 0, y: 0 },
        { name: "C", x: 5, y: 3 },
      ].map(({ name, x, y }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={y}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad shape="rect" width={0.8} height={0.8} portHints={["1"]} />
            </footprint>
          }
        />
      ))}
      <trace from="A.1" to="B.1" routingPhaseIndex={0} />
      <trace from="B.1" to="C.1" routingPhaseIndex={1} />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          { connection: "A.1", route: [wire(-5, 0), wire(0, 0)] },
        ]}
      />
      <autoroutingphase
        phaseIndex={1}
        pcbTracePaths={[{ connection: "C.1", route: [wire(0, 0), wire(5, 3)] }]}
      />
      <pcbnotetext
        text="Same net: A-B in phase 0, B-C in phase 1"
        pcbY={-3}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(
    starts.map((event) => event.simpleRouteJson.connections.length),
  ).toEqual([1, 1])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
