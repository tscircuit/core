import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel clearance accepts the scaled routing width including equal gaps", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      width={24}
      height={14}
      layoutMode="grid"
      row={1}
      boardGap={0.6}
      tabWidth={2}
      mouseBites={false}
      panelizationMethod="tab-routing"
    >
      <board width={5} height={5}>
        <pcbnotetext text="0.6 mm gap" fontSize={0.4} />
      </board>
      <board width={5} height={5}>
        <pcbnotetext text="0.6 mm route" fontSize={0.4} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  const cutouts = circuit.db.pcb_cutout.list()
  expect(cutouts).toHaveLength(16)
  expect(
    cutouts.every((cutout) => cutout.shape === "rect" && cutout.height === 0.6),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
