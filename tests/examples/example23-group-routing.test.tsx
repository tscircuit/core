import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("group routing with auto-local autorouter", async () => {
  const { circuit } = getTestFixture()

  // Create a group with subcircuits and traces
  circuit.add(
    <board width="20mm" height="20mm" autorouter="auto-local">
      <group name="ParentGroup">
        <group name="ChildGroup1">
          <chip name="U1" footprint="soic8" pcbX={5} pcbY={0} />
          <resistor
            name="R1"
            pcbX={-5}
            pcbY={0}
            resistance={100}
            footprint="0402"
          />
          <trace from=".U1 > .pin1" to=".R1 > .pin1" />
        </group>
        <group name="ChildGroup2">
          <chip name="U2" footprint="soic8" pcbX={5} pcbY={10} />
          <resistor
            name="R2"
            pcbX={-5}
            pcbY={10}
            resistance={100}
            footprint="0402"
          />
          <trace from=".U2 > .pin1" to=".R2 > .pin1" />
        </group>
      </group>
    </board>,
  )

  // Render the circuit and wait for autorouting to complete
  await circuit.renderUntilSettled()

  // Get the circuit JSON and filter for autorouting results
  const circuitJson = circuit.getCircuitJson()
  // console.log("Circuit JSON:", JSON.stringify(circuitJson, null, 2));
  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  const pcbVias = circuitJson.filter((el) => el.type === "pcb_via")

  // Verify that traces and vias were created
  expect(pcbTraces.length).toBeGreaterThan(0)
  expect(pcbVias.length).toBeGreaterThan(0)

  // Verify specific traces and vias (optional)
  expect(pcbTraces).toMatchInlineSnapshot(`
    [
      {
        "from": { "x": 5, "y": 0, "layer": "top" },
        "to": { "x": -5, "y": 0, "layer": "top" },
        "type": "pcb_trace",
      },
      {
        "from": { "x": 5, "y": 10, "layer": "top" },
        "to": { "x": -5, "y": 10, "layer": "top" },
        "type": "pcb_trace",
      },
    ]
  `)

  expect(pcbVias).toMatchInlineSnapshot(`
    [
      {
        "x": 0,
        "y": 0,
        "hole_diameter": 0.3,
        "outer_diameter": 0.6,
        "layers": ["top", "bottom"],
        "type": "pcb_via",
      },
    ]
  `)
})
