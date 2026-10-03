import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ICS_43434 } from "tests/fixtures/ics43434-import/C5656610"

test("ICS-43434 ground polygons have polygon solder paste", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={8}>
      <ICS_43434 name="MIC1" pcbX={1} pcbY={-1} />
      <pcbnotetext
        text="C5656610: GND polygons have solder paste"
        pcbY={3.3}
        fontSize={0.25}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const pads = circuit.db.pcb_smtpad.list()
  const groundPads = pads.filter((pad) => pad.shape === "polygon")
  const paste = circuit.db.pcb_solder_paste.list()
  expect(pads).toHaveLength(9)
  expect(groundPads).toHaveLength(4)
  expect(paste).toHaveLength(9)
  expect(
    paste.filter((aperture) =>
      groundPads.some((pad) => pad.pcb_smtpad_id === aperture.pcb_smtpad_id),
    ),
  ).toHaveLength(4)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
