import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("chip with pcbPinLabels should use different labels for PCB vs schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="pinrow4"
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
          pin3: "SIG",
          pin4: "EN",
        }}
        pcbPinLabels={{
          pin1: "V+",
          pin2: "G",
          pin3: "SIGNAL",
          pin4: "ENABLE",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["VCC", "GND"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["SIG", "EN"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-chip-with-pcbpinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-chip-with-pcbpinlabels",
  )
})

test("chip should fallback to pinLabels when pcbPinLabels not provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U2"
        footprint="pinrow3"
        pinLabels={{
          pin1: "IN",
          pin2: "OUT",
          pin3: "GND",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["IN", "OUT", "GND"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-chip-fallback-pinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-chip-fallback-pinlabels",
  )
})

test("jumper with pcbPinLabels should use different labels for PCB vs schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="pinrow3"
        pinLabels={{
          pin1: "A",
          pin2: "B",
          pin3: "C",
        }}
        pcbPinLabels={{
          pin1: "A_PCB",
          pin2: "B_PCB",
          pin3: "C_PCB",
        }}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["A", "B", "C"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-jumper-with-pcbpinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-jumper-with-pcbpinlabels",
  )
})

test("jumper should fallback to pinLabels when pcbPinLabels not provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J2"
        footprint="pinrow2"
        pinLabels={{
          pin1: "DATA",
          pin2: "CLK",
        }}
        schPortArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["DATA", "CLK"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-jumper-fallback-pinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-jumper-fallback-pinlabels",
  )
})

test("pinheader with pcbPinLabels should use different labels for PCB vs schematic", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P1"
        pinCount={4}
        footprint="pinrow4"
        pinLabels={["SCL", "SDA", "VCC", "GND"]}
        pcbPinLabels={{
          pin1: "SCL_PCB",
          pin2: "SDA_PCB",
          pin3: "V+",
          pin4: "GND_PCB",
        }}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["SCL", "SDA", "VCC", "GND"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-pinheader-with-pcbpinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-pinheader-with-pcbpinlabels",
  )
})

test("pinheader should fallback to pinLabels when pcbPinLabels not provided", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P2"
        pinCount={3}
        footprint="pinrow3"
        pinLabels={["MOSI", "MISO", "SS"]}
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["MOSI", "MISO", "SS"],
          },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path + "-pinheader-fallback-pinlabels",
  )
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-pinheader-fallback-pinlabels",
  )
})
