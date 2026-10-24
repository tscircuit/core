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
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    "Panel board clearance (1.000 mm) must be at least the routing cutout width (2 mm). Increase board spacing or reduce tabWidth.",
  )

  expect(circuit.db.pcb_cutout.list()).toHaveLength(0)
  await expect(circuit.db.toArray()).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })
})
