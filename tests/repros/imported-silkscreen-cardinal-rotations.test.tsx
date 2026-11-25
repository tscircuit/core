import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import importedText from "./assets/imported-silkscreen-cardinal-rotations.json"

test.failing(
  "imported silkscreen retains board rotation on both sides",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={26} height={16} routingDisabled schematicDisabled>
        <pcbnotetext
          text="Top row: top / bottom row: bottom; all labels upright"
          pcbY={6.5}
          fontSize={0.7}
        />
        <subcircuit circuitJson={importedText as AnyCircuitElement[]} />
      </board>,
    )
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)

    for (const rotation of [0, 90, 180, 270]) {
      expect(
        circuit.db.pcb_silkscreen_text.getWhere({ text: `T${rotation}` }),
      ).toMatchObject({ layer: "top", ccw_rotation: 0 })
      expect(
        circuit.db.pcb_silkscreen_text.getWhere({ text: `B${rotation}` }),
      ).toMatchObject({ layer: "bottom", ccw_rotation: 0 })
    }
  },
)
