import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test(
  "chip renders pinLabels without footprint",
  async () => {
    const { circuit } = getTestFixture()

    circuit.setPlatform({
      drcChecksDisabled: true,
      pcbDisabled: true,
    })

    circuit.add(
      <board width="10mm" height="10mm">
        <chip name="U1" pinLabels={{ 1: "A", 2: "B", 3: "C", 4: "D" }} />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(circuit.db.schematic_port.list()).toHaveLength(4)
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  },
  { timeout: 80000 },
)
