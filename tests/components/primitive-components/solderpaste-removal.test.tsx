import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("removing a solderpaste primitive removes its aperture through the render lifecycle", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} routingDisabled schematicDisabled>
      <solderpaste shape="rect" width={2} height={1} pcbX={-3} />
      <solderpaste shape="circle" radius={1} pcbX={3} />
      <pcbnotetext
        text="Rectangle removed / circle remains"
        pcbY={-2.5}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(2)
  const rectangle = circuit.selectAll("solderpaste")[0]!
  rectangle.shouldBeRemoved = true
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(1)
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(1)
  expect(circuit.db.pcb_solder_paste.list()[0]).toMatchObject({
    shape: "circle",
    x: 3,
    y: 0,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
