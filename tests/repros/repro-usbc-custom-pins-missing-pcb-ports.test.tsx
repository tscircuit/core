import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import usbCFootprint from "tests/fixtures/assets/usb-c-C165948.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: USB-C custom schematic pins lose PCB connections", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={28}
      height={18}
      schAutoLayoutEnabled
      partsEngine={{
        findPart: async () => ({ jlcpcb: ["C165948"] }),
        fetchPartCircuitJson: async () =>
          usbCFootprint.map((element) => any_circuit_element.parse(element)),
      }}
    >
      <connector
        name="J1"
        standard="usb_c"
        supplierPartNumbers={{ jlcpcb: ["C165948"] }}
        schPinArrangement={{
          rightSide: {
            pins: [15, 16, 6, 12, 8, 10, 9, 7, 11, 5, 13, 14, 2, 1, 4, 3],
            direction: "top-to-bottom",
          },
        }}
        pcbX={-8}
        pcbRotation={270}
      />
      <resistor
        name="R1"
        resistance="5.1k"
        footprint="0805"
        pcbX={5}
        pcbY={2}
      />
      <trace from=".J1 > .CC1" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".J1 > .GND1" />
      <pcbnotetext
        text={`<trace from=".J1 > .CC1" to=".R1 > .pin1" />
<trace from=".R1 > .pin2" to=".J1 > .GND1" />`}
        pcbY={7}
        fontSize={0.55}
      />
      <pcbnotetext
        text={`Expected: USB-C -> R1 -> USB-C ground
Bug: schematic wires exist, PCB traces are missing`}
        pcbY={-7}
        fontSize={0.6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
