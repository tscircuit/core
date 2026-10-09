import { test, expect } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("only SMT pads emit paste in a mixed through-hole board", async () => {
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
  expect(solder_paste.length).toBe(4)
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
})
