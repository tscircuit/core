import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("panel routing slots must fit between neighboring boards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      width={60}
      height={40}
      layoutMode="grid"
      row={1}
      boardGap={1}
      tabWidth={2}
      tabLength={5}
      mouseBites={false}
      panelizationMethod="tab-routing"
    >
      <board name="A" width={20} height={20}>
        <smtpad shape="circle" radius={0.2} pcbX={9.3} pcbY={6} noSolderPaste />
        <pcbnotetext text="BOARD A" fontSize={1} />
        <pcbnotetext text="PAD >" pcbX={6} pcbY={6} fontSize={0.8} />
        <pcbnotetext text="1 mm gap" pcbY={-4} fontSize={1} />
      </board>
      <board name="B" width={20} height={20}>
        <smtpad
          shape="circle"
          radius={0.2}
          pcbX={-9.3}
          pcbY={6}
          noSolderPaste
        />
        <pcbnotetext text="BOARD B" fontSize={1} />
        <pcbnotetext text="< PAD" pcbX={-6} pcbY={6} fontSize={0.8} />
        <pcbnotetext text="2 mm routes" pcbY={-4} fontSize={1} />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_cutout.list()).toHaveLength(16)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
