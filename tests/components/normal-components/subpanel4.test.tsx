import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel emits pcb_panel with center and dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" pcbX={0} pcbY={0}>
      <subpanel width="50mm" height="30mm" pcbX={10} pcbY={20}>
        <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
      </subpanel>
    </panel>,
  )

  circuit.render()

  const panels = circuit.db.pcb_panel.list()
  expect(panels).toHaveLength(2)

  // Find the subpanel (the smaller one)
  const subpanel = panels.find((p) => p.width === 50)
  expect(subpanel).toMatchObject({
    width: 50,
    height: 30,
    center: { x: 10, y: 20 },
    covered_with_solder_mask: true,
  })
})
