import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon pad has solder paste", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={5}>
      <smtpad
        shape="polygon"
        points={[
          { x: -1, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 0 },
        ]}
        portHints={[]}
      />
      <pcbnotetext
        text="Polygon pad: solder paste at 70% scale"
        pcbY={2}
        fontSize={0.25}
      />
    </board>,
  )
  circuit.render()
  expect(circuit.db.pcb_smtpad.list()[0]?.shape).toBe("polygon")
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
