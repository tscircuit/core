import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro104: chip on bottom layer with rotation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled={true} layers={4} width="26.00mm" height="26.00mm">
      <chip
        name="chip-1"
        footprint="pinrow6"
        pcbX={-3}
        pcbY={3}
        pcbRotation={45.0}
        layer="bottom"
        manufacturerPartNumber="GENERIC"
      />
      <chip
        name="chip-2"
        footprint="pinrow6"
        pcbX={3}
        pcbY={-5}
        pcbRotation={45.0}
        layer="top"
        manufacturerPartNumber="GENERIC"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbComponents = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
      elm.type === "pcb_component",
  )
  expect(pcbComponents[0].rotation).toBe(45)

  const pcbCourtyards = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_courtyard_rect" }> =>
      elm.type === "pcb_courtyard_rect",
  )

  // Bug: ccw_rotation should be 45
  expect(pcbCourtyards[0].ccw_rotation).toBe(45)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
