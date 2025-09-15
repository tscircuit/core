import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("complex chip schematic with multiple connections", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pinLabels={{
          pin1: "RESET",
          pin2: "XTAL2",
          pin3: "XTAL1",
          pin4: "AREF",
          pin5: "AVCC",
          pin6: "AGND",
          pin7: "VCC",
          pin8: "GND",
        }}
        schX={3}
        schY={0}
        pcbX={-7}
        pcbY={-10}
        footprint="breakoutheaders_left4_right4_w8mm_p2.3mm"
      />
      <chip
        name="U2"
        pinLabels={{
          pin1: "RESET",
          pin2: "XTAL1",
          pin3: "XTAL2",
          pin4: "AVCC",
          pin5: "VCC",
          pin6: "GND",
        }}
        schX={-1}
        schY={0}
        pcbX={4}
        pcbY={13}
        footprint="qfp6_w3_p0.3mm"
      />
      {/* Example of tracing from chip 1 to chip 2 */}
      <trace from=".U1 > .pin2" to=".U2 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
