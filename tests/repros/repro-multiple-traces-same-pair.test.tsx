import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * When multiple <trace> elements connect the same pair of components,
 * only one schematic_trace is produced. The logical connectivity
 * (source_trace) correctly preserves all connections, but the
 * schematic rendering silently drops all but the first.
 *
 * This affects chip→chip, chip→resistor, resistor→chip, and
 * resistor→resistor connections equally. The official test at
 * tests/components/normal-components/chip-complex-schematic-crossings.test.tsx
 * is also affected (3 resistor→resistor cross traces produce 0
 * schematic_trace elements).
 *
 * Two <trace> elements connect U1 and U2:
 *   U1.A → U2.C
 *   U1.B → U2.D
 *
 * Expected: 2 schematic_trace elements
 * Actual:   1 schematic_trace element
 */
test.failing(
  "multiple direct <trace> elements between the same pair of components produce only one schematic_trace",
  async () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="30mm" height="10mm">
        <chip name="U1" pinLabels={{ pin1: "A", pin2: "B" }} />
        <chip name="U2" pinLabels={{ pin1: "C", pin2: "D" }} schX={4} />
        <trace from="U1.A" to="U2.C" />
        <trace from="U1.B" to="U2.D" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const schematicTraces = circuit
      .getCircuitJson()
      .filter((e: any) => e.type === "schematic_trace")

    expect(schematicTraces).toHaveLength(2)

    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
)
