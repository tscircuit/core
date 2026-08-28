import { test, expect } from "bun:test"
import { Circuit } from "lib/index"

test("pushbutton documented side1/side2 aliases should resolve", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        connections={{ side1: "net.LEFT", side2: "net.RIGHT" }}
      />
    </board>,
  )

  // The component should render without a connection resolution error
  expect(() => circuit.render()).not.toThrow()

  const circuitJson = circuit.getCircuitJson()
  const traces = circuitJson.filter(
    (e: any) => e.type === "pcb_trace" || e.type === "schematic_trace",
  )
  // At minimum, the connections should have resolved to source ports (no dangling side1/side2)
  expect(traces.length).toBeGreaterThan(0)
})
