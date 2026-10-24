import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel routes use actual clearance when grid cells exceed board size", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      width={100}
      height={40}
      layoutMode="grid"
      row={1}
      cellWidth={40}
      boardGap={1}
      tabWidth={2}
      mouseBites={false}
      panelizationMethod="tab-routing"
    >
      <board width={20} height={20}>
        <pcbnotetext text="21 mm actual gap" fontSize={0.8} />
      </board>
      <board width={20} height={20}>
        <pcbnotetext text="2 mm routes" fontSize={0.8} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_cutout.list()).toHaveLength(16)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
