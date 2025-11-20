import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createPanel = () => (
  <panel width="100mm" height="100mm">
    <board width="10mm" height="10mm" routingDisabled />
  </panel>
)

test("panel can only contain boards", () => {
  const { circuit } = getTestFixture()

  expect(() =>
    circuit.add(
      <panel width="100mm" height="100mm">
        <resistor name="R1" resistance={100} />
      </panel>,
    ),
  ).toThrow("<panel> can only contain <board> elements")
})

test("panel must be a root element", () => {
  const { circuit } = getTestFixture()

  expect(() =>
    circuit.add(
      <board width="10mm" height="10mm">
        {createPanel()}
      </board>,
    ),
  ).toThrow("<panel> must be a root-level element")
})

test("only one panel is allowed", () => {
  const { circuit } = getTestFixture()

  circuit.add(createPanel())

  expect(() => {
    circuit.add(createPanel())
    circuit.render()
  }).toThrow("Only one <panel> is allowed per circuit")
})

test("panel must be the root element when present", () => {
  const { circuit } = getTestFixture()

  circuit.add(createPanel())

  expect(() => {
    circuit.add(<board width="20mm" height="20mm" routingDisabled />)
    circuit.render()
  }).toThrow("<panel> must be the root element of the circuit")
})

test("panel must contain at least one board", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm">
      {/* intentionally empty */}
    </panel>,
  )

  expect(() => {
    circuit.render()
  }).toThrow("<panel> must contain at least one <board>")
})

test("panel emits pcb_panel with center", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="50mm" pcbX="10mm" pcbY="20mm">
      <board width="10mm" height="10mm" routingDisabled pcbX={0} pcbY={0} />
    </panel>,
  )

  circuit.render()

  const pcbPanel = circuit.db.pcb_panel.list()[0]
  expect(pcbPanel).toMatchObject({
    width: 100,
    height: 50,
    center: { x: 10, y: 20 },
    covered_with_solder_mask: true,
  })
})

test("panel noSolderMask disables solder mask coverage", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel width="100mm" height="100mm" noSolderMask>
      <board width="10mm" height="10mm" routingDisabled />
    </panel>,
  )

  circuit.render()

  const pcbPanel = circuit.db.pcb_panel.list()[0]
  expect(pcbPanel.covered_with_solder_mask).toBe(false)
})
