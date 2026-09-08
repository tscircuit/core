import { expect, test } from "bun:test"
import { pcb_solder_paste } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone paste needs no copper pad and respects PCB-disabled rendering", async () => {
  for (const pcbDisabled of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.pcbDisabled = pcbDisabled
    circuit.add(
      <board width={16} height={12}>
        <solderpaste shape="rect" width="4mm" height="2mm" pcbX={-3} />
        <solderpaste shape="circle" radius="1mm" pcbX={3} layer="bottom" />
        <pcbnotetext
          text="Paste only: top rectangle / bottom circle"
          pcbY={4}
          fontSize={0.5}
        />
      </board>,
    )
    circuit.render()
    const paste = circuit.db.pcb_solder_paste.list()
    expect(paste).toHaveLength(pcbDisabled ? 0 : 2)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
    expect(circuit.db.pcb_port.list()).toHaveLength(0)
    for (const aperture of paste) {
      expect(pcb_solder_paste.safeParse(aperture).success).toBe(true)
      expect(aperture.pcb_smtpad_id).toBeUndefined()
      expect(aperture.pcb_component_id).toBeUndefined()
    }
    if (!pcbDisabled) {
      expect(paste[0]).toMatchObject({
        shape: "rect",
        width: 4,
        height: 2,
        x: -3,
        y: 0,
        layer: "top",
      })
      expect(paste[1]).toMatchObject({
        shape: "circle",
        radius: 1,
        x: 3,
        y: 0,
        layer: "bottom",
      })
      await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
        showSolderPaste: true,
      })
    }
  }
})
