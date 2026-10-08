import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// https://github.com/tscircuit/tscircuit/issues/5381
test("refdes labels on a dense MCU module stay clear of pads and each other", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="26mm" height="18mm" routingDisabled>
      <pcbnotetext
        pcbX={0}
        pcbY={10}
        fontSize={0.6}
        text="Refdes labels clear of pads and each other"
      />
      <chip name="U1" footprint="qfn32" pcbX={1} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        pcbX={1}
        pcbY={3.75}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        pcbX={3.3}
        pcbY={3.75}
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0402"
        pcbX={1}
        pcbY={-3.75}
      />
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="0402"
        pcbX={-1.3}
        pcbY={-3.75}
      />
      <capacitor
        name="C5"
        capacitance="100nF"
        footprint="0402"
        pcbX={4.75}
        pcbY={1}
        pcbRotation={90}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={-1}
      />
      <pinheader name="J1" pinCount={2} pcbX={-9.5} pcbY={7.2} />
      <capacitor
        name="C6"
        capacitance="10uF"
        footprint="0805"
        pcbX={-9}
        pcbY={4}
      />
      <chip name="U2" footprint="soic8" pcbX={-9} pcbY={0.2} />
      <capacitor
        name="C7"
        capacitance="10uF"
        footprint="0805"
        pcbX={-9}
        pcbY={-3.6}
      />
      <pinheader name="J2" pinCount={4} pcbX={1} pcbY={-7} />
      <led name="D1" color="green" footprint="0603" pcbX={9.5} pcbY={2} />
      <led name="D2" color="green" footprint="0603" pcbX={9.5} pcbY={0.5} />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        pcbX={11.95}
        pcbY={2}
      />
      <resistor
        name="R5"
        resistance="1k"
        footprint="0402"
        pcbX={11.95}
        pcbY={0.5}
      />
      <testpoint name="TP1" footprintVariant="pad" pcbX={-4.5} pcbY={7.9} />
      <testpoint name="TP2" footprintVariant="pad" pcbX={5.5} pcbY={7.9} />
      <testpoint name="TP3" footprintVariant="pad" pcbX={10} pcbY={-7.9} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
