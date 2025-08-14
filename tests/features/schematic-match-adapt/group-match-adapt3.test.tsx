import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib"
import { writeGlobalDebugGraphics } from "tests/fixtures/writeGlobalDebugGraphics"

test("group-match-adapt3", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled matchAdapt>
      <chip
        name="U3"
        footprint="soic8"
        pinLabels={{
          pin8: "VDD",
          pin4: "GND",
          pin1: "N_CS",
          pin6: "CLK",
          pin5: "D0_DI",
          pin2: "D1_DO",
          pin3: "D2_N_WP",
          pin7: "D3_N_HOLD",
        }}
        schPinArrangement={{
          leftSide: {
            pins: [8, 4],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [1, 6, 5, 2, 3, 7],
            direction: "top-to-bottom",
          },
        }}
        schPinStyle={{
          pin4: { marginTop: 0.65 },
        }}
        connections={{
          VDD: sel.net.V3_3,
          GND: sel.net.GND,
          pin7: sel.net.V3_3,
          pin3: sel.net.V3_3,
          pin2: sel.net.FLASH_SDO,
          pin5: sel.net.FLASH_SDI,
          pin6: sel.net.FLASH_SCK,
          pin1: sel.net.FLASH_N_CS,
        }}
      />
      <capacitor
        name="C20"
        capacitance="0.1uF"
        footprint="0402"
        schOrientation="vertical"
        connections={{
          pin1: sel.U3.VDD,
          pin2: sel.U3.GND,
        }}
      />
      <resistor
        name="R11"
        resistance="100k"
        schOrientation="vertical"
        connections={{
          pin1: sel.net.V3_3,
          pin2: sel.U3.N_CS,
        }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  writeGlobalDebugGraphics()
})
