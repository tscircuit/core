import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rect smtpad should convert to rotated_rect when PCB rotation is supplied", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <chip name="U1" pcbX={0} pcbY={0} footprint="ms012" />
      <chip
        name="U2"
        pcbX={-10}
        pcbY={-10}
        pcbRotation={45}
        footprint="ms012"
      />
    </board>,
  )

  circuit.render()

  const rotatedRectSmtpads = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_smtpad" && elm.shape === "rotated_rect")
  const rectSmtpads = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_smtpad" && elm.shape === "rect")

  // U1 has no rotation, should have rect pads
  // U2 has 45-degree rotation, should have rotated_rect pads
  expect(rotatedRectSmtpads.length).toBe(8)
  expect(rectSmtpads.length).toBe(8)

  // Verify the rotated pads have correct rotation
  for (const pad of rotatedRectSmtpads) {
    if (pad.type === "pcb_smtpad" && pad.shape === "rotated_rect") {
      expect(pad.ccw_rotation).toBeCloseTo(45, 1)
    }
  }

  // Verify solder paste is also created with rotation for rotated pads
  const solderPastes = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_solder_paste")

  const rotatedSolderPastes = solderPastes.filter(
    (sp) => sp.type === "pcb_solder_paste" && sp.shape === "rotated_rect",
  )

  expect(rotatedSolderPastes.length).toBe(8)

  for (const paste of rotatedSolderPastes) {
    if (paste.type === "pcb_solder_paste" && paste.shape === "rotated_rect") {
      expect(paste.ccw_rotation).toBeCloseTo(45, 1)
    }
  }
})
