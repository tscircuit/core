import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated pill pad has solder paste", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={5}>
      <smtpad
        shape="rotated_pill"
        width={2}
        height={1}
        radius={0.5}
        ccwRotation={45}
        portHints={[]}
      />
      <pcbnotetext
        text="Rotated pill: paste at 70% scale"
        pcbY={2}
        fontSize={0.25}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  expect(circuit.db.pcb_smtpad.list()[0]?.shape).toBe("rotated_pill")
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(1)
  const [paste] = circuit.db.pcb_solder_paste.list()
  expect(paste.shape).toBe("rotated_pill")
  if (paste.shape !== "rotated_pill")
    throw new Error("Expected rotated pill paste")
  expect(paste.width).toBeCloseTo(1.4)
  expect(paste.height).toBeCloseTo(0.7)
  expect(paste.radius).toBeCloseTo(0.35)
  expect(paste.ccw_rotation).toBe(45)
})
