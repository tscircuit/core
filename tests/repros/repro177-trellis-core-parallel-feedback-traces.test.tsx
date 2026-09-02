import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro177: parallel feedback resistor and capacitor traces overlap", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board
      routingDisabled
      schAutoLayoutEnabled
      schTraceAutoLabelEnabled
      schMaxTraceDistance="0.8mm"
    >
      <net name="P0V9" isPowerNet />
      <net name="GND" isGroundNet />

      <schematictext
        text="REPRO: keep the parallel R5/C4 feedback traces distinct"
        schX={-0.65}
        schY={-1.5}
        fontSize={0.22}
      />

      <inductor
        name="L2"
        inductance="2.2uH"
        schX={-3.89}
        schY={-4}
        connections={{
          pin1: "net.BUCK_0V9_SW",
          pin2: "net.P0V9",
        }}
      />
      <resistor
        name="R5"
        resistance="51kohm"
        schX={-1.5}
        schY={-3.58}
        connections={{
          pin1: "net.P0V9",
          pin2: "net.BUCK_0V9_FB",
        }}
      />
      <capacitor
        name="C4"
        capacitance="10pF"
        schX={0.2}
        schY={-3}
        schOrientation="vertical"
        connections={{
          pin1: "net.P0V9",
          pin2: "net.BUCK_0V9_FB",
        }}
      />
      <resistor
        name="R7"
        resistance="100kohm"
        schX={-1.5}
        schY={-5}
        connections={{
          pin1: "net.BUCK_0V9_FB",
          pin2: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
