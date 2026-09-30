import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dogbone autorouting phase uses SRJ and feeds the following router", async () => {
  const { circuit } = getTestFixture()
  const stages: string[] = []
  circuit.on("autorouting:start", (event) => {
    stages.push(event.autorouterName ?? "")
  })
  circuit.add(
    <board
      width={16}
      height={12}
      minTraceWidth={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
    >
      <chip
        name="U1"
        pcbX={-3}
        footprint={
          <footprint>
            <smtpad
              portHints={["1"]}
              shape="circle"
              radius={0.2}
              pcbX={0}
              pcbY={0}
            />
            <smtpad
              portHints={["2"]}
              shape="circle"
              radius={0.2}
              pcbX={0.8}
              pcbY={0}
            />
            <smtpad
              portHints={["3"]}
              shape="circle"
              radius={0.2}
              pcbX={0}
              pcbY={0.8}
            />
            <smtpad
              portHints={["4"]}
              shape="circle"
              radius={0.2}
              pcbX={0.8}
              pcbY={0.8}
            />
          </footprint>
        }
      />
      <autoroutingphase autorouter="dogbone" fanoutRoutingLayers={["bottom"]} />
      <resistor
        name="R1"
        footprint="0402"
        resistance="1k"
        layer="bottom"
        pcbX={4}
      />
      <trace from="U1.1" to="R1.1" />
      <pcbnotetext
        pcbY={4}
        text="Local dogbone, then bottom-layer routing to R1"
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(stages).toEqual(["dogbone", "tscircuit"])
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(1)
  const exit = circuit.db.pcb_via.list()[0]!
  expect(exit.to_layer).toBe("bottom")
  expect(
    circuit.db.pcb_trace
      .list()
      .filter((trace) =>
        trace.route.some(
          (point) =>
            point.route_type === "wire" &&
            point.layer === "bottom" &&
            Math.hypot(point.x - exit.x, point.y - exit.y) < 1e-6,
        ),
      ).length,
  ).toBeGreaterThan(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
