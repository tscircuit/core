import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro152: explicit netlabels should not render as long schematic traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schMaxTraceDistance={2.4}>
      <chip
        name="U1"
        schX={0}
        pinLabels={{ pin1: "GND", pin2: "VCC" }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["pin2", "pin1"],
          },
        }}
      />

      <capacitor
        name="C1"
        capacitance="0.1uF"
        schX={10}
        schRotation={-90}
        connections={{ pin1: "net.V3_3", pin2: "net.GND" }}
      />

      <netlabel net="V3_3" connection="U1.VCC" schX={-1.2} schY={0.5} />
      <netlabel net="GND" connection="U1.GND" schX={-1.2} schY={-0.5} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
