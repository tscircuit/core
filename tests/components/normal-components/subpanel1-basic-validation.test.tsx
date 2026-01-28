import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subpanel can only contain boards or subpanels", () => {
  const { circuit } = getTestFixture()

  expect(() =>
    circuit.add(
      <panel width="100mm" height="100mm">
        <subpanel>
          <resistor name="R1" resistance={100} />
        </subpanel>
      </panel>,
    ),
  ).toThrow("<subpanel> can only contain <board> or <subpanel> elements")
})

test("subpanel must be inside a panel", () => {
  const { circuit } = getTestFixture()

  // Adding subpanel directly to root (not inside panel) should fail
  expect(() => {
    circuit.add(
      <subpanel>
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>,
    )
    circuit.render()
  }).toThrow("<subpanel> must be inside a <panel>")
})

test("subpanel can only contain boards validates at add time", () => {
  const { circuit } = getTestFixture()

  // This validates that the add() method correctly rejects non-board children
  expect(() =>
    circuit.add(
      <panel width="100mm" height="100mm">
        <subpanel>
          <group />
        </subpanel>
        <board width="10mm" height="10mm" routingDisabled />
      </panel>,
    ),
  ).toThrow("<subpanel> can only contain <board> or <subpanel> elements")
})

test("subpanel does not create pcb_panel record", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      <subpanel>
        <board width="10mm" height="10mm" routingDisabled />
      </subpanel>
    </panel>,
  )

  circuit.render()

  // Only one pcb_panel should exist (from the panel, not the subpanel)
  const pcbPanels = circuit.db.pcb_panel.list()
  expect(pcbPanels).toHaveLength(1)
})
