import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("masked pill pads omit solder paste", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={8} height={5}>
      <smtpad
        shape="pill"
        width={2}
        height={1}
        radius={0.5}
        coveredWithSolderMask
        pcbX={-2}
        portHints={[]}
      />
      <smtpad
        shape="rotated_pill"
        width={2}
        height={1}
        radius={0.5}
        ccwRotation={45}
        coveredWithSolderMask
        pcbX={2}
        portHints={[]}
      />
      <pcbnotetext
        text="Masked pills: no solder paste"
        pcbY={2}
        fontSize={0.3}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)
})
