import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { any_circuit_element } from "circuit-json"

// Regression for #2843. Board-level holes emitted `pcb_component_id: null`
// (the schema allows only a string or undefined) and DIP plated holes emitted
// a `circular_hole_with_rect_pad` without the required `hole_shape` / `pad_shape`
// fields. Both made `any_circuit_element.parse()` throw on valid boards.
test("board-level holes and DIP plated holes emit schema-valid circuit json", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <hole name="H1" pcbX={-8} pcbY={7} diameter="1mm" />
      <platedhole
        name="H2"
        shape="circular_hole_with_rect_pad"
        holeDiameter={1}
        rectPadWidth={2}
        rectPadHeight={2}
        pcbX={8}
        pcbY={7}
      />
      <chip name="U1" footprint="dip8" pcbX={0} pcbY={-3} />
      <pcbnotetext
        pcbY={12}
        fontSize={0.9}
        text="holes emit schema-valid circuit json"
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // The scenario has to actually produce the shapes the bug was about,
  // otherwise the parse loop below would pass vacuously.
  expect(circuitJson.some((el) => el.type === "pcb_hole")).toBe(true)
  expect(
    circuitJson.some(
      (el) =>
        el.type === "pcb_plated_hole" &&
        (el as any).shape === "circular_hole_with_rect_pad",
    ),
  ).toBe(true)

  // Every hole element has to pass the circuit-json parser named in the issue.
  for (const element of circuitJson) {
    if (element.type !== "pcb_hole" && element.type !== "pcb_plated_hole") {
      continue
    }
    const result = any_circuit_element.safeParse(element)
    if (!result.success) {
      const label = (element as any).shape ?? (element as any).hole_shape
      throw new Error(
        `${element.type} (${label}) failed any_circuit_element.parse():\n${JSON.stringify(result.error.issues, null, 2)}`,
      )
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
