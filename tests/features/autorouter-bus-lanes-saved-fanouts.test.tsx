import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus_lanes receives exact fixed fanout traces instead of rasterized obstacles", async () => {
  const { circuit } = getTestFixture(),
    inputs: any[] = []
  circuit.on("autorouting:start", (event: any) =>
    inputs.push(event.simpleRouteJson),
  )
  circuit.add(
    <board width={16} height={10} minTraceWidth={0.1}>
      {(["A", "B"] as const).map((name, i) => (
        <fanout
          key={name}
          name={`${name}_FANOUT`}
          pcbRelative
          pcbX={i ? 4 : -4}
          pcbY={0}
          pcbTracePaths={[
            {
              connection: `${name}.pin1`,
              route: [
                { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.1 },
                {
                  route_type: "wire",
                  x: i ? -2 : 2,
                  y: 0,
                  layer: "top",
                  width: 0.1,
                },
              ],
            },
          ]}
        >
          <chip name={name} pcbX={0} pcbY={0} pinLabels={{ pin1: "DATA" }}>
            <footprint>
              <smtpad
                shape="circle"
                radius={0.2}
                pcbX={0}
                pcbY={0}
                portHints={["pin1"]}
              />
            </footprint>
          </chip>
        </fanout>
      ))}
      <autoroutingphase
        name="DDR_INTERCONNECT"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      <trace
        name="DATA"
        from=".A > .pin1"
        to=".B > .pin1"
        routingPhaseIndex={0}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2.8}
        fontSize={0.32}
        text="Saved top fanouts: A at x=-4 to -2; B at x=4 to 2mm."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.45}
        fontSize={0.32}
        text="bus_lanes adds only the bridge between x=-2 and 2mm."
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4.1}
        fontSize={0.32}
        text="Two exact saved paths + one new path = continuous copper."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const phase = inputs.at(-1)
  expect(phase.connections).toHaveLength(1)
  expect(phase.traces).toHaveLength(2)
  expect(
    phase.connections[0].pointsToConnect
      .map((p: any) => p.x)
      .sort((a: number, b: number) => a - b),
  ).toEqual([-2, 2])
  const json = circuit.getCircuitJson()
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(3)
  expect(json.filter((e) => e.type.includes("error"))).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
