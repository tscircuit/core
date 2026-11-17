import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved paths infer connections across a plated-pad junction", async () => {
  const { circuit } = getTestFixture()
  const starts: AutoroutingStartEvent[] = []
  circuit.on("autorouting:start", (event) => starts.push(event))
  const wire = (x: number, y: number, layer: "top" | "bottom") => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.25,
    layer,
  })
  circuit.add(
    <board width={16} height={12} routeRemaining={false}>
      <chip
        name="A"
        pcbX={-5}
        pinLabels={{ pin1: "PLATED" }}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              shape="circle"
              holeDiameter={0.4}
              outerDiameter={0.8}
            />
          </footprint>
        }
      />
      {[
        { name: "B", x: 5, y: 0, layer: "top" as const },
        { name: "C", x: 0, y: 4, layer: "bottom" as const },
      ].map(({ name, x, y, layer }) => (
        <chip
          key={name}
          name={name}
          pcbX={x}
          pcbY={y}
          layer={layer}
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
        pcbTracePaths={[
          { connection: "A.1", route: [wire(-5, 0, "top"), wire(5, 0, "top")] },
          {
            connection: "A.1",
            route: [wire(-5, 0, "bottom"), wire(0, 4, "bottom")],
          },
        ]}
      />
      <pcbnotetext
        text="B-C connects through plated A: top A-B, bottom A-C"
        pcbY={-3}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(starts).toHaveLength(1)
  expect(starts[0]!.simpleRouteJson.connections).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list().map((trace) => trace.route)).toMatchObject(
    [
      [wire(-5, 0, "top"), wire(5, 0, "top")],
      [wire(-5, 0, "bottom"), wire(0, 4, "bottom")],
    ],
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
