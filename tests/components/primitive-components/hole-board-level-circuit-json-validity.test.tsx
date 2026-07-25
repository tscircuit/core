import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-level holes produce valid circuit json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      <hole name="H1" pcbX={-5} pcbY={5} diameter="1mm" />
      <platedhole
        name="PH1"
        pcbX={5}
        pcbY={-5}
        shape="circle"
        holeDiameter="0.5mm"
        outerDiameter="0.9mm"
      />
      {/* A footprint whose holes DO belong to a component. */}
      <chip name="U1" footprint="dip8" pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const holes = circuitJson.filter(
    (e: any) => e.type === "pcb_hole" || e.type === "pcb_plated_hole",
  ) as any[]

  const boardLevelHoles = holes.filter((h) => h.pcb_component_id === undefined)
  const componentHoles = holes.filter((h) => h.pcb_component_id !== undefined)

  expect(boardLevelHoles.length).toBeGreaterThan(0)
  expect(componentHoles.length).toBeGreaterThan(0)

  // `pcb_component_id` is `z.string().optional()` on these schemas, so `null`
  // is rejected while an absent value is fine. A board-level hole has no
  // owning component, and the `null` used to make the element fail
  // `any_circuit_element.parse()` entirely.
  for (const hole of boardLevelHoles) {
    expect(hole.pcb_component_id).toBeUndefined()
  }

  // Holes that belong to a footprint must keep their component id.
  for (const hole of componentHoles) {
    expect(typeof hole.pcb_component_id).toBe("string")
  }

  for (const hole of holes) {
    const result = any_circuit_element.safeParse(hole)
    expect({ type: hole.type, valid: result.success }).toEqual({
      type: hole.type,
      valid: true,
    })
  }
})
