import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Schematic trace overlaps manufacturer label", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        manufacturerPartNumber="part-number"
        schPortArrangement={{
          leftSide: {
            pins: [16, 15, 20, 17, 4, 27, 28, 19, 26, 25, 7, 18, 21],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: [1, 5, 11, 3, 2, 9, 10, 6, 23, 22, 14, 13, 12],
            direction: "top-to-bottom",
          },
        }}
        schX={0}
        schY={0}
        schWidth={1}
        schHeight={5}
        footprint="ssop28Db"
        pinLabels={{
          "1": "TXD",
          "5": "RXD",
          "11": "CTS",
          "3": "RTS",
          "2": "DTR",
          "9": "DSR",
          "10": "DCD",
          "6": "RI",
          "23": "TXLED",
          "22": "RXLED",
          "14": "PWRUN",
          "13": "TXDEN",
          "12": "SLEEP",
          "16": "USBDM",
          "15": "USBDP",
          "20": "VCC",
          "17": "3V3OUT",
          "4": "VCCIO",
          "27": "OSCI",
          "28": "OSCO",
          "19": "RESET",
          "26": "TEST",
          "25": "AGND",
          "7": "GND7",
          "18": "GND18",
          "21": "GND21",
        }}
      />
      <diode
        name="LED1"
        footprint="0805"
        symbolName="diode"
        schX={2}
        schY={1}
      />
      <trace path={[".LED1 > port.right", ".U1 > .pin20"]} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})