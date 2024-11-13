import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a net alias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <netalias net="net1" schX="1mm" schY="1mm" />
    </board>,
  )

  circuit.render()

  expect(circuit.db.schematic_net_label.list()).toHaveLength(1)
})

it("should render a net alias with correct anchor position on components", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="0.1uF"
        pcbX={-7}
        pcbY={8}
        pcbRotation={90}
        schX={-2.5}
        schY={3}
        footprint="0402"
        symbolName="capacitor_vert"
      />

      <netalias net="GND" schX={-2.57} schY={3.55} anchorSide="down" />
      <trace from=".C1 > .pos" to="net.GND" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
