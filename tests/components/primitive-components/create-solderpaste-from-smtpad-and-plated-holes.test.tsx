import { test, expect } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("create solderpaste from smtpad", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <resistor
        name="R1"
        pcbX={0}
        pcbY={0}
        resistance={1000}
        footprint={"0402"}
      />
      <resistor
        name="R2"
        pcbX={0}
        pcbY={0}
        resistance={1000}
        pcbRotation={70}
        footprint={"0402"}
      />
      <platedhole
        outerHeight={0.2}
        outerWidth={0.5}
        holeHeight={0.2}
        holeWidth={0.2}
        shape="pill"
      />
    </board>,
  )

  circuit.render()

  const solder_paste = circuit.db.pcb_solder_paste.list()
  const platedhole = circuit.db.pcb_plated_hole.list()
  const smtpad = circuit.db.pcb_smtpad.list()
  expect(solder_paste.length).toBe(6) //the pill should have top and bottom solder paste
  expect(platedhole.length).toBe(1)
  expect(smtpad.length).toBe(4)
  if (
    smtpad[2].shape === "rotated_rect" &&
    solder_paste[2].shape === "rotated_rect" &&
    smtpad[3].shape === "rotated_rect" &&
    solder_paste[3].shape === "rotated_rect"
  ) {
    expect(solder_paste[2].ccw_rotation).toBe(70)
    expect(solder_paste[3].ccw_rotation).toBe(70)
  }
  for (const paste of solder_paste) pcb_solder_paste.parse(paste)
  expect(platedhole[0].shape).toBe("pill")
  for (const paste of solder_paste.slice(4)) {
    expect(paste.shape).toBe("rotated_pill")
    if (paste.shape !== "rotated_pill") throw new Error("Expected pill paste")
    expect(paste.height).toBe(0.2)
    expect(paste.width).toBe(0.5)
    expect(paste.radius).toBe(0.1)
    expect(paste.ccw_rotation).toBe(0)
  }
})
