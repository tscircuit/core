import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("USB-C infers SMT and retains paste on plated pill slots", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={20} routingDisabled>
      <chip name="USB1" footprint="usbcmidmount" />
      <chip name="J1" footprint="pinrow2" pcbY={-6} />
      <pcbnotetext
        text="USB-C retains paste; through-hole header has none"
        pcbY={8}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list().length).toBeGreaterThan(0)
  const slots = circuit.db.pcb_plated_hole
    .list()
    .filter((hole) => hole.shape === "pill")
  expect(slots.length).toBeGreaterThan(0)
  for (const slot of slots) {
    const paste = circuit.db.pcb_solder_paste
      .list()
      .filter(
        (entry) =>
          entry.shape !== "polygon" && entry.x === slot.x && entry.y === slot.y,
      )
    expect(paste.map((entry) => entry.layer).sort()).toEqual(["bottom", "top"])
  }
  const headerHoles = circuit.db.pcb_plated_hole
    .list()
    .filter(
      (hole) =>
        hole.pcb_component_id === circuit.selectOne(".J1")?.pcb_component_id,
    )
  expect(headerHoles).toHaveLength(2)
  for (const hole of headerHoles) {
    expect(
      circuit.db.pcb_solder_paste
        .list()
        .filter(
          (paste) =>
            paste.shape !== "polygon" &&
            paste.x === hole.x &&
            paste.y === hole.y,
        ),
    ).toHaveLength(0)
  }
  const pasteView = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        element.type === "pcb_board" ||
        element.type === "pcb_note_text" ||
        (element.type === "pcb_solder_paste" && element.layer === "top"),
    )
  await expect(pasteView).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
