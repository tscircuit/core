import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: schematic trace runs through testpoints", async () => {
  const { circuit } = getTestFixture()

  const pinLabels = {
    pin1: ["GND"],
    pin2: ["VDD", "V3_3", "3V3"],
    pin3: ["SDA"],
    pin4: ["SCL"],
  } as const
  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint
        name="TP3"
        footprintVariant="pad"
        padDiameter="0.762mm"
        layer="bottom"
        schX={0.5}
        schY={-0.7}
        pcbX={8.5725}
        pcbY={-0.9525}
        connections={{ pin1: "net.V3_3" }}
      />
      <testpoint
        name="TP2"
        footprintVariant="pad"
        padDiameter="0.762mm"
        layer="bottom"
        schX={0.5}
        schY={-1.05}
        pcbX={8.5725}
        pcbY={0.9525}
        connections={{ pin1: "net.SDA" }}
      />
      <testpoint
        name="TP1"
        footprintVariant="pad"
        padDiameter="0.762mm"
        layer="bottom"
        schX={0.5}
        schY={-1.4}
        pcbX={8.5725}
        pcbY={2.8575}
        connections={{ pin1: "net.SCL" }}
      />
      <testpoint
        name="TP4"
        footprintVariant="pad"
        padDiameter="0.762mm"
        layer="bottom"
        schX={0.5}
        schY={-1.75}
        pcbX={8.5725}
        pcbY={-2.8575}
        connections={{ pin1: "net.GND" }}
      />
      <chip
        name="J1"
        pinLabels={pinLabels}
        schX={1.5}
        schY={-5.25}
        pcbX={6.487}
        pcbY={0}
        pcbRotation={90}
        connections={{
          pin1: "net.GND",
          pin2: "net.V3_3",
          pin3: "net.SDA",
          pin4: "net.SCL",
        }}
        schWidth={0.7}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["SCL", "SDA", "VDD", "GND"],
          },
        }}
        supplierPartNumbers={{
          jlcpcb: ["C160404"],
        }}
        manufacturerPartNumber="SM04B_SRSS_TB_LF_SN"
      />
      <resistor
        name="R1"
        resistance="2.2k"
        footprint="0402"
        schX={3.0}
        schY={3.7}
        schRotation={90}
        pcbX={1.397}
        pcbY={1.27}
        pcbRotation={90}
        connections={{
          pin1: "net.SCL",
          pin2: "net.SCL_PU",
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
