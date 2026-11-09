import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a tooling rail sits in the panel edge padding", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" edgePadding="5mm">
      <board name="B1" width="14mm" height="18mm" routingDisabled>
        <pcbnotetext text="Panel rails" fontSize={0.6} />
      </board>
      <toolingrail name="LEFT_RAIL" panelSide="left" width="5mm">
        <pcbnotetext text="LEFT RAIL" pcbRotation={90} fontSize={0.6} />
      </toolingrail>
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
    showPcbGroups: true,
  })
  expect(
    circuit.db.pcb_group.list().find((group) => group.name === "LEFT_RAIL"),
  ).toMatchObject({
    center: { x: -9.5, y: 0 },
    width: 5,
    height: 28,
  })
})
