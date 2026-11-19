import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("standalone paste honors direct pcbRotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={9} routingDisabled schematicDisabled>
      <solderpaste
        shape="rect"
        width={4}
        height={1}
        pcbX={-4.5}
        pcbRotation={35}
      />
      <group name="PARENT" pcbX={4.5} pcbRotation={35}>
        <solderpaste shape="rect" width={4} height={1} />
      </group>
      <pcbnotetext
        text="Direct rotation: 35 deg"
        pcbX={-4.5}
        pcbY={-2.5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="Parent rotation: 35 deg"
        pcbX={4.5}
        pcbY={-2.5}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
  expect(circuit.db.pcb_solder_paste.list()).toEqual([
    expect.objectContaining({
      x: -4.5,
      shape: "rotated_rect",
      width: 4,
      height: 1,
      ccw_rotation: 35,
    }),
    expect.objectContaining({
      x: 4.5,
      shape: "rotated_rect",
      width: 4,
      height: 1,
      ccw_rotation: 35,
    }),
  ])
})
