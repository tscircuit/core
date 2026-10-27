import { expect, test } from "bun:test"
import type { Diode } from "lib/components/normal-components/Diode"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("generic diode footprints include polarity fabrication notes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={9} routingDisabled>
      <diode
        name="D1"
        footprint="smdpads2_p3.3848mm_pw0.95mm_ph1.15mm"
        pinLabels={{ pin1: ["cathode", "neg"], pin2: ["anode", "pos"] }}
      />
      <pcbnotetext
        text="Expected: cathode (-) left, anode (+) right"
        pcbY={-2.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  // Capture the missing assembly artwork before the regression assertion fails.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const diode = circuit.selectOne(".D1") as Diode
  const filter = { pcb_component_id: diode.pcb_component_id! }
  const paths = circuit.db.pcb_fabrication_note_path.list(filter)
  const labels = circuit.db.pcb_fabrication_note_text.list(filter)
  expect(paths).toHaveLength(4)
  expect(labels.map((label) => label.text).sort()).toEqual(["+", "-"])
  expect(
    labels.find((label) => label.text === "-")!.anchor_position.x,
  ).toBeLessThan(labels.find((label) => label.text === "+")!.anchor_position.x)
})
