import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import circuitJson from "./assets/simple-circuit.json"

test("panel respects explicit width and height props", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="200mm" height="150mm">
      <board circuitJson={circuitJson as any} />
      <board circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  const pcbPanel = circuit.db.pcb_panel.list()[0]
  expect(pcbPanel.width).toBe(200)
  expect(pcbPanel.height).toBe(150)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
