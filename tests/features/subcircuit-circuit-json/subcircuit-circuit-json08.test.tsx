import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import subcircuitCircuitJson from "./assets/pic-programmer-circuit-json.json"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json08", async () => {
  const { circuit } = await getTestFixture()
  circuit.add(
    <subcircuit
      name="S1"
      circuitJson={subcircuitCircuitJson}
      pcbX={0}
      pcbY={0}
    />,
  )

  await circuit.renderUntilSettled()

  const expectedHoles = subcircuitCircuitJson.filter(
    (elm) => elm.type === "pcb_hole",
  )
  expect(circuit.db.pcb_hole.list()).toHaveLength(7)
  expect(circuit.db.pcb_hole.list()).toEqual(
    expect.arrayContaining(
      expectedHoles.map((hole) =>
        expect.objectContaining({
          x: hole.x,
          y: hole.y,
          hole_shape: hole.hole_shape,
          hole_diameter: hole.hole_diameter,
        }),
      ),
    ),
  )
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(106)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
}, 25000)
