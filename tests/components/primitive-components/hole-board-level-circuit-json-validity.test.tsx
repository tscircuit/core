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
      <chip name="U1" footprint="dip8" pcbX={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const holes = circuitJson.filter(
    (e: any) => e.type === "pcb_hole" || e.type === "pcb_plated_hole",
  ) as any[]

  expect(holes.length).toBeGreaterThan(0)

  const boardLevelHoles = holes.filter(
    (h) => h.pcb_component_id == null || h.pcb_component_id === undefined,
  )
  expect(boardLevelHoles.length).toBeGreaterThan(0)

  for (const hole of boardLevelHoles) {
    expect(hole.pcb_component_id).toBeUndefined()
  }

  for (const hole of holes) {
    const result = any_circuit_element.safeParse(hole)
    expect({
      type: hole.type,
      shape: hole.shape ?? hole.hole_shape,
      pcb_component_id: hole.pcb_component_id,
      valid: result.success,
      issues: result.success ? undefined : result.error.issues.slice(0, 3),
    }).toEqual({
      type: hole.type,
      shape: hole.shape ?? hole.hole_shape,
      pcb_component_id: hole.pcb_component_id,
      valid: true,
    })
  }
})
