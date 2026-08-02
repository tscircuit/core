import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("explicit power nets use rail symbols without power-like names", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <net name="LOGIC_3V3" isPowerNet />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schRotation="90deg"
      />
      <trace from=".R1 > .pin1" to="net.LOGIC_3V3" />
      <schematictext
        text="isPowerNet uses rail_up"
        schX={0}
        schY={-2}
        fontSize={0.18}
      />
    </board>,
  )

  circuit.render()

  const powerLabel = circuit.db.schematic_net_label
    .list()
    .find((label) => label.text === "LOGIC_3V3")
  expect(powerLabel?.symbol_name).toBe("rail_up")
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
