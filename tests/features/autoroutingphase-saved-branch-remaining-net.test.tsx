import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saving part of a net leaves its other connection for remaining routing", async () => {
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
    <board
      width={16}
      height={12}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (input) =>
          input.connections.map((connection) => ({
            type: "pcb_trace",
            pcb_trace_id: `remaining_${connection.name}`,
            connection_name: connection.name,
            route: connection.pointsToConnect.map((point) =>
              wire(point.x, point.y),
            ),
          })),
        ),
      }}
    >
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
          pinLabels={{ pin1: name }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} width={0.8} height={0.8} shape="rect" />
            </footprint>
          }
        />
      ))}
      <trace from="A.1" to="B.1" />
      <trace from="B.1" to="C.1" />
      <autoroutingphase
        phaseIndex={0}
        pcbTracePaths={[
          { connection: "A.1", route: [wire(-5, 0), wire(0, 0)] },
        ]}
      />
      <pcbnotetext
        text="Same net: saved A-B, automatic B-C"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(starts.map((event) => event.autorouterName)).toEqual([
    "precomputed",
    "custom",
  ])
  expect(
    starts.map((event) => event.simpleRouteJson.connections.length),
  ).toEqual([1, 1])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
