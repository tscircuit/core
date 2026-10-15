import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone rectangles and circles create paste without copper or electrical ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} routingDisabled schematicDisabled>
      <group name="PASTE" pcbX={2} pcbY={1}>
        <solderpaste shape="rect" width="2mm" height="1mm" pcbX={-4} />
        <solderpaste shape="circle" radius="0.8mm" pcbX={2} layer="bottom" />
      </group>
      <pcbnotetext
        text="Paste only: top rectangle / bottom circle"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(apertures).toHaveLength(2)
  expect(apertures[0]).toMatchObject({
    shape: "rect",
    width: 2,
    height: 1,
    x: -2,
    y: 1,
    layer: "top",
  })
  expect(apertures[1]).toMatchObject({
    shape: "circle",
    radius: 0.8,
    x: 4,
    y: 1,
    layer: "bottom",
  })
  const group = circuit.db.pcb_group.list().find((g) => g.name === "PASTE")!
  for (const aperture of apertures) {
    expect(any_circuit_element.parse(aperture)).toEqual(aperture)
    expect(aperture.pcb_smtpad_id).toBeUndefined()
    expect(aperture.pcb_component_id).toBeUndefined()
    expect(aperture.pcb_group_id).toBe(group.pcb_group_id)
    expect(aperture.subcircuit_id).toBe(group.subcircuit_id)
  }
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.source_port.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
