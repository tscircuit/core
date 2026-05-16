import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schTraceAutoLabelEnabled false keeps explicit schDisplayLabel net labels", () => {
  const { circuit } = getTestFixture()

  circuit._featureMspSchematicTraceRouting = true

  circuit.add(
    <board width="10mm" height="10mm" schTraceAutoLabelEnabled={false}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schRotation="90deg"
      />
      <trace from=".R1 > .pin1" to="net.GND" schDisplayLabel="GND" />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)
  expect(labels[0].text).toBe("GND")
  expect(labels[0].symbol_name).toBe("rail_down")
})

test("group schTraceAutoLabelEnabled false keeps explicit schDisplayLabel net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" subcircuit schTraceAutoLabelEnabled={false}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          schX={0}
          schY={0}
          schRotation="90deg"
        />
        <trace from=".R1 > .pin1" to="net.GND" schDisplayLabel="GND" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)
  expect(labels[0].text).toBe("GND")
  expect(labels[0].symbol_name).toBe("rail_down")
})
