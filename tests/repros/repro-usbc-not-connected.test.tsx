import type { PartsEngine } from "@tscircuit/props"
import { test, expect } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbCC165948CircuitJson from "tests/fixtures/assets/usb-c-C165948.circuit.json"

test("when standard usb_c is used, ", async () => {
  const { circuit } = getTestFixture()

  const mockPartsEngine: PartsEngine = {
    findPart: async ({ sourceComponent }: any) => {
      if (
        sourceComponent.ftype === "simple_connector" &&
        sourceComponent.standard === "usb_c"
      ) {
        return { jlcpcb: ["C165948"] }
      }
      return {}
    },
    fetchPartCircuitJson: async ({
      supplierPartNumber,
    }: {
      supplierPartNumber?: string
      manufacturerPartNumber?: string
    }) => {
      if (supplierPartNumber === "C165948") {
        return usbCC165948CircuitJson as AnyCircuitElement[]
      }
      return undefined
    },
  }

  circuit.add(
    <board width="48mm" height="58mm" partsEngine={mockPartsEngine}>
      <net name="VCC" />
      <net name="GND" />
      <connector name="JUSB" schX={-1.5} schY={2.5} standard="usb_c" />

      {/* this works */}
      {/* <connector name="JUSB" schX={-1.5} schY={2.5} /> */}

      <resistor
        name="R2"
        resistance="10k"
        footprint="0805"
        schX={2.5}
        schY={2.5}
        schSectionName="timing-network"
      />
      <chip
        name="U1"
        footprint="soic8"
        schX={5.5}
        schY={2.5}
        pinLabels={{
          pin1: "GND",
          pin2: "TRIG",
          pin3: "OUT",
          pin4: "RESET",
          pin5: "CTRL",
          pin6: "THRES",
          pin7: "DISCH",
          pin8: "VCC",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["RESET", "CTRL", "THRES", "TRIG"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "OUT", "DISCH", "GND"],
          },
        }}
      />

      {/* the netlabel is never drawn, and the component floats */}
      <trace from=".R2 > .pin1" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
