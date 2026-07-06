import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro145: GND label overlaps horizontal trace", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board width="36mm" height="24mm" schLayout={{ layoutMode: "none" }}>
      <resistor
        name="R_RUN"
        resistance="100k"
        schX={-3.2}
        schY={-1.8}
        schRotation="90deg"
      />
      <resistor
        name="R_BOOT"
        resistance="10k"
        schX={4.2}
        schY={-1.8}
        schRotation="90deg"
      />
      <resistor
        name="R1"
        resistance="5.1k"
        schX={2.2}
        schY={2.2}
        schRotation="90deg"
      />

      <trace from="R_RUN.pin2" to="R_BOOT.pin2" />
      <trace from="R_RUN.pin1" to="net.VCC" />

      <netlabel
        net="GND"
        connection="R1.pin1"
        anchorSide="top"
        schX={2.2}
        schY={-0.75}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
