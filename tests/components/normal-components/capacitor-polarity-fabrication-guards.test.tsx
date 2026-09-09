import { expect, test } from "bun:test"
import type { Capacitor } from "lib/components/normal-components/Capacitor"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor polarity signs require polarized and distinct pads and preserve authored notes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={32} height={10} routingDisabled>
      <capacitor
        name="C_POL"
        capacitance="10uF"
        footprint="1206"
        polarized
        pcbX={-12}
      >
        <fabricationnotetext text="USER NOTE" pcbY={-2} fontSize={0.5} />
        <fabricationnotepath
          route={[
            { x: -0.5, y: 2 },
            { x: 0.5, y: 2 },
          ]}
        />
      </capacitor>
      <capacitor
        name="C_NONPOL"
        capacitance="10uF"
        footprint="1206"
        pcbX={-4}
      />
      <capacitor name="C_NO_PADS" capacitance="10uF" polarized pcbX={4} />
      <capacitor name="C_COINCIDENT" capacitance="10uF" polarized pcbX={12}>
        <footprint>
          <smtpad shape="rect" width={1} height={1} portHints={["1", "pos"]} />
          <smtpad shape="rect" width={1} height={1} portHints={["2", "neg"]} />
        </footprint>
      </capacitor>
    </board>,
  )
  await circuit.renderUntilSettled()
  const capacitor = circuit.selectOne(".C_POL") as Capacitor
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(4)
  capacitor.updatePcbComponentSizeCalculation()
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(4)
  expect(
    circuit.db.pcb_fabrication_note_text.list().map((n) => n.text),
  ).toEqual(["USER NOTE"])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
