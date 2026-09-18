import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/checks/issues/302
const noRoutes = async () => {
  const handlers: Record<string, Function> = {}
  return {
    on: (event: string, handler: Function) => {
      handlers[event] = handler
    },
    start: () => handlers.complete({ traces: [] }),
    stop: () => {},
  }
}

export default function PourConnectedViaPort() {
  return (
    <board
      width={10}
      height={10}
      layers={2}
      autorouter={{ algorithmFn: noRoutes }}
    >
      <net name="GND" />
      {[-2, 2].map((x, i) => (
        <chip
          key={i}
          name={`J${i + 1}`}
          pcbX={x}
          pinLabels={{ pin1: "GND" }}
          footprint={
            <footprint>
              <platedhole
                portHints={["1"]}
                holeDiameter={0.8}
                outerDiameter={1.4}
                shape="circle"
              />
            </footprint>
          }
        />
      ))}
      <trace from=".J1 > .pin1" to="net.GND" />
      <trace from=".J2 > .pin1" to="net.GND" />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={0}
        pcbY={2.5}
      />
      <trace from=".R1 > .pin1" to="net.GND" />
      <via
        name="VGND"
        pcbX={-2}
        pcbY={2.5}
        holeDiameter={0.3}
        outerDiameter={0.6}
        connectsTo="net.GND"
      />
      <trace from=".R1 > .pin1" to=".VGND > .top" pcbStraightLine />
      <copperpour
        layer="bottom"
        connectsTo="net.GND"
        clearance={0.16}
        boardEdgeMargin={0.31}
      />
      <pcbnotetext pcbX={-2} pcbY={-1.2} text="J1.GND" fontSize={0.4} />
      <pcbnotetext pcbX={2} pcbY={-1.2} text="J2.GND" fontSize={0.4} />
      <pcbnotetext pcbX={-2} pcbY={3.4} text="VGND.top" fontSize={0.35} />
      <pcbnotetext
        pcbX={0}
        pcbY={-3.2}
        text="R1 -> via -> bottom GND pour -> J1 / J2"
        fontSize={0.3}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-4}
        text="Expected: 0 disconnected GND ports"
        fontSize={0.3}
      />
    </board>
  )
}

test("issue #302: a trace to a via port does not disconnect pour-only GND contacts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<PourConnectedViaPort />)
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  expect(
    circuitJson.filter((e) => e.type === "pcb_copper_pour").length,
  ).toBeGreaterThan(0)
  expect(circuitJson.filter((e) => e.type === "pcb_trace")).toHaveLength(1)
  const via = circuitJson.find((e) => e.type === "pcb_via")!
  expect(via.pcb_port_ids).toHaveLength(2)
  const trace = circuitJson.find((e) => e.type === "pcb_trace")!
  const end = trace.route.at(-1)!
  expect(end.route_type).toBe("wire")
  if (end.route_type === "wire") {
    expect(via.pcb_port_ids).toContain(end.end_pcb_port_id!)
  }
  expect(
    circuitJson.filter((e) => e.type === "pcb_port_not_connected_error"),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showErrorsInTextOverlay: true,
  })
})
