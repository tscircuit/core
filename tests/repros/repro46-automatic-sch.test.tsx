import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"
import { sel } from "lib/sel"

export default test("repro46: automatic schematic snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        schPinArrangement={{
          leftSide: {
            direction: "bottom-to-top",
            pins: [1, 2],
          },
          rightSide: {
            direction: "bottom-to-top",
            pins: [3, 4],
          },
        }}
        pinLabels={{
          pin1: "GND",
          pin2: "VDD",
          pin3: "SCK",
          pin4: "DATA",
        }}
        connections={{
          pin2: sel.C2.pin2,
          pin3: sel.net.SCL,
          pin4: sel.net.SDA,
        }}
        manufacturerPartNumber="SI7021"
      />
      <netlabel net="GND" anchorSide="top" connection="U1.pin1" />

      <capacitor
        name="C2"
        capacitance="0.1uf"
        connections={{
          pin1: sel.net.GND,
          pin2: sel.net.V3_3,
        }}
        schRotation={90}
      />
      <resistor
        name="R1"
        resistance="4.7k"
        schRotation={90}
        connections={{
          pin1: sel.U1.pin4,
        }}
      />

      <resistor
        name="R2"
        resistance="4.7k"
        schRotation={90}
        connections={{
          pin1: sel.U1.pin3,
        }}
      />
      <solderjumper
        name="SJ1"
        pinCount={3}
        bridgedPins={[
          ["1", "2"],
          ["2", "3"],
        ]}
        schRotation={180}
        connections={{
          pin2: sel.net.V3_3,
          pin3: sel.R1.pin2,
          pin1: sel.R2.pin2,
        }}
      />
    </board>,
  )

  await circuit.render()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
