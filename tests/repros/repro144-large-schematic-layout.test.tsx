import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro144: large manually positioned schematic layout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="110mm" height="75mm" layers={2} routingDisabled>
      <pinheader
        name="J1"
        pinCount={8}
        pitch="2.54mm"
        gender="male"
        pinLabels={["VIN", "GND", "IO1", "IO2", "IO3", "IO4", "SDA", "SCL"]}
        showSilkscreenPinLabels
        pcbX={-48}
        pcbY={25}
        schX={-14}
        schY={4}
      />

      <pinheader
        name="J2"
        pinCount={8}
        pitch="2.54mm"
        gender="male"
        pinLabels={[
          "OUT1",
          "OUT2",
          "OUT3",
          "OUT4",
          "OUT5",
          "OUT6",
          "GND",
          "VIN",
        ]}
        showSilkscreenPinLabels
        pcbX={48}
        pcbY={25}
        schX={14}
        schY={4}
      />

      <pinheader
        name="J3"
        pinCount={6}
        pitch="2.54mm"
        gender="female"
        pinLabels={["DBG1", "DBG2", "DBG3", "DBG4", "GND", "VIN"]}
        showSilkscreenPinLabels
        pcbX={0}
        pcbY={-30}
        schX={0}
        schY={-9}
      />

      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          pin1: "IN1",
          pin2: "IN2",
          pin3: "IN3",
          pin4: "GND",
          pin5: "OUT1",
          pin6: "OUT2",
          pin7: "OUT3",
          pin8: "VCC",
        }}
        pcbX={-30}
        pcbY={12}
        schX={-9}
        schY={2}
      />

      <chip
        name="U2"
        footprint="soic8"
        pinLabels={{
          pin1: "A",
          pin2: "B",
          pin3: "C",
          pin4: "GND",
          pin5: "Y1",
          pin6: "Y2",
          pin7: "Y3",
          pin8: "VCC",
        }}
        pcbX={-10}
        pcbY={12}
        schX={-3}
        schY={2}
      />

      <chip
        name="U3"
        footprint="soic8"
        pinLabels={{
          pin1: "SDA",
          pin2: "SCL",
          pin3: "ADDR",
          pin4: "GND",
          pin5: "IRQ",
          pin6: "OUTA",
          pin7: "OUTB",
          pin8: "VCC",
        }}
        pcbX={10}
        pcbY={12}
        schX={3}
        schY={2}
      />

      <chip
        name="U4"
        footprint="soic8"
        pinLabels={{
          pin1: "IN",
          pin2: "FB",
          pin3: "EN",
          pin4: "GND",
          pin5: "SW",
          pin6: "BOOT",
          pin7: "PG",
          pin8: "VIN",
        }}
        pcbX={30}
        pcbY={12}
        schX={9}
        schY={2}
      />

      <chip
        name="U5"
        footprint="soic8"
        pinLabels={{
          pin1: "A1",
          pin2: "A2",
          pin3: "A3",
          pin4: "GND",
          pin5: "B1",
          pin6: "B2",
          pin7: "B3",
          pin8: "VCC",
        }}
        pcbX={-30}
        pcbY={-8}
        schX={-9}
        schY={-4}
      />

      <chip
        name="U6"
        footprint="soic8"
        pinLabels={{
          pin1: "RX",
          pin2: "TX",
          pin3: "CTS",
          pin4: "GND",
          pin5: "RTS",
          pin6: "DTR",
          pin7: "DSR",
          pin8: "VCC",
        }}
        pcbX={-10}
        pcbY={-8}
        schX={-3}
        schY={-4}
      />

      <chip
        name="U7"
        footprint="soic8"
        pinLabels={{
          pin1: "INP",
          pin2: "INN",
          pin3: "REF",
          pin4: "GND",
          pin5: "OUT",
          pin6: "GAIN",
          pin7: "SHDN",
          pin8: "VCC",
        }}
        pcbX={10}
        pcbY={-8}
        schX={3}
        schY={-4}
      />

      <chip
        name="U8"
        footprint="soic8"
        pinLabels={{
          pin1: "CS",
          pin2: "MISO",
          pin3: "WP",
          pin4: "GND",
          pin5: "MOSI",
          pin6: "SCK",
          pin7: "HOLD",
          pin8: "VCC",
        }}
        pcbX={30}
        pcbY={-8}
        schX={9}
        schY={-4}
      />

      <resistor
        name="R1"
        resistance="10k"
        footprint="0603"
        pcbX={-42}
        pcbY={10}
        schX={-13}
        schY={9}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={-42}
        pcbY={5}
        schX={-10.5}
        schY={9}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0603"
        pcbX={-42}
        pcbY={0}
        schX={-8}
        schY={9}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0603"
        pcbX={-42}
        pcbY={-5}
        schX={-5.5}
        schY={9}
      />
      <resistor
        name="R5"
        resistance="4.7k"
        footprint="0603"
        pcbX={-20}
        pcbY={24}
        schX={-3}
        schY={9}
      />
      <resistor
        name="R6"
        resistance="4.7k"
        footprint="0603"
        pcbX={-12}
        pcbY={24}
        schX={-0.5}
        schY={9}
      />
      <resistor
        name="R7"
        resistance="330"
        footprint="0603"
        pcbX={12}
        pcbY={24}
        schX={2}
        schY={9}
      />
      <resistor
        name="R8"
        resistance="330"
        footprint="0603"
        pcbX={20}
        pcbY={24}
        schX={4.5}
        schY={9}
      />
      <resistor
        name="R9"
        resistance="100"
        footprint="0603"
        pcbX={42}
        pcbY={10}
        schX={7}
        schY={9}
      />
      <resistor
        name="R10"
        resistance="100"
        footprint="0603"
        pcbX={42}
        pcbY={5}
        schX={9.5}
        schY={9}
      />
      <resistor
        name="R11"
        resistance="2.2k"
        footprint="0603"
        pcbX={42}
        pcbY={0}
        schX={12}
        schY={9}
      />
      <resistor
        name="R12"
        resistance="2.2k"
        footprint="0603"
        pcbX={42}
        pcbY={-5}
        schX={14.5}
        schY={9}
      />

      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0603"
        pcbX={-34}
        pcbY={22}
        schX={-11}
        schY={-12}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0603"
        pcbX={-14}
        pcbY={22}
        schX={-8}
        schY={-12}
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0603"
        pcbX={6}
        pcbY={22}
        schX={-5}
        schY={-12}
      />
      <capacitor
        name="C4"
        capacitance="100nF"
        footprint="0603"
        pcbX={26}
        pcbY={22}
        schX={-2}
        schY={-12}
      />
      <capacitor
        name="C5"
        capacitance="1uF"
        footprint="0603"
        pcbX={-34}
        pcbY={-20}
        schX={1}
        schY={-12}
      />
      <capacitor
        name="C6"
        capacitance="1uF"
        footprint="0603"
        pcbX={-14}
        pcbY={-20}
        schX={4}
        schY={-12}
      />
      <capacitor
        name="C7"
        capacitance="1uF"
        footprint="0603"
        pcbX={6}
        pcbY={-20}
        schX={7}
        schY={-12}
      />
      <capacitor
        name="C8"
        capacitance="1uF"
        footprint="0603"
        pcbX={26}
        pcbY={-20}
        schX={10}
        schY={-12}
      />

      <led
        name="D1"
        color="red"
        footprint="led0603"
        pcbX={-5}
        pcbY={30}
        schX={17}
        schY={2}
      />
      <led
        name="D2"
        color="green"
        footprint="led0603"
        pcbX={5}
        pcbY={30}
        schX={17}
        schY={0}
      />
      <led
        name="D3"
        color="blue"
        footprint="led0603"
        pcbX={15}
        pcbY={30}
        schX={17}
        schY={-2}
      />
      <led
        name="D4"
        color="yellow"
        footprint="led0603"
        pcbX={25}
        pcbY={30}
        schX={17}
        schY={-4}
      />

      <trace from=".J1 > .pin1" to="net.VIN" />
      <trace from=".J1 > .pin2" to="net.GND" />
      <trace from=".J2 > .pin8" to="net.VIN" />
      <trace from=".J2 > .pin7" to="net.GND" />
      <trace from=".J3 > .pin6" to="net.VIN" />
      <trace from=".J3 > .pin5" to="net.GND" />

      <trace from=".U1 > .pin8" to="net.VIN" />
      <trace from=".U1 > .pin4" to="net.GND" />
      <trace from=".U2 > .pin8" to="net.VIN" />
      <trace from=".U2 > .pin4" to="net.GND" />
      <trace from=".U3 > .pin8" to="net.VIN" />
      <trace from=".U3 > .pin4" to="net.GND" />
      <trace from=".U4 > .pin8" to="net.VIN" />
      <trace from=".U4 > .pin4" to="net.GND" />
      <trace from=".U5 > .pin8" to="net.VIN" />
      <trace from=".U5 > .pin4" to="net.GND" />
      <trace from=".U6 > .pin8" to="net.VIN" />
      <trace from=".U6 > .pin4" to="net.GND" />
      <trace from=".U7 > .pin8" to="net.VIN" />
      <trace from=".U7 > .pin4" to="net.GND" />
      <trace from=".U8 > .pin8" to="net.VIN" />
      <trace from=".U8 > .pin4" to="net.GND" />

      <trace from=".C1 > .pin1" to="net.VIN" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".C2 > .pin1" to="net.VIN" />
      <trace from=".C2 > .pin2" to="net.GND" />
      <trace from=".C3 > .pin1" to="net.VIN" />
      <trace from=".C3 > .pin2" to="net.GND" />
      <trace from=".C4 > .pin1" to="net.VIN" />
      <trace from=".C4 > .pin2" to="net.GND" />
      <trace from=".C5 > .pin1" to="net.VIN" />
      <trace from=".C5 > .pin2" to="net.GND" />
      <trace from=".C6 > .pin1" to="net.VIN" />
      <trace from=".C6 > .pin2" to="net.GND" />
      <trace from=".C7 > .pin1" to="net.VIN" />
      <trace from=".C7 > .pin2" to="net.GND" />
      <trace from=".C8 > .pin1" to="net.VIN" />
      <trace from=".C8 > .pin2" to="net.GND" />

      <trace from=".J1 > .pin3" to=".R1 > .pin1" />
      <trace from=".R1 > .pin2" to=".U1 > .pin1" />
      <trace from=".J1 > .pin4" to=".R2 > .pin1" />
      <trace from=".R2 > .pin2" to=".U1 > .pin2" />
      <trace from=".J1 > .pin5" to=".R3 > .pin1" />
      <trace from=".R3 > .pin2" to=".U1 > .pin3" />
      <trace from=".J1 > .pin6" to=".R4 > .pin1" />
      <trace from=".R4 > .pin2" to=".U2 > .pin1" />

      <trace from=".J1 > .pin7" to=".U3 > .pin1" />
      <trace from=".J1 > .pin8" to=".U3 > .pin2" />
      <trace from=".R5 > .pin1" to="net.VIN" />
      <trace from=".R5 > .pin2" to=".U3 > .pin1" />
      <trace from=".R6 > .pin1" to="net.VIN" />
      <trace from=".R6 > .pin2" to=".U3 > .pin2" />

      <trace from=".U1 > .pin5" to=".U2 > .pin2" />
      <trace from=".U1 > .pin6" to=".U2 > .pin3" />
      <trace from=".U1 > .pin7" to=".U5 > .pin1" />
      <trace from=".U2 > .pin5" to=".U5 > .pin2" />
      <trace from=".U2 > .pin6" to=".U5 > .pin3" />
      <trace from=".U2 > .pin7" to=".U6 > .pin1" />
      <trace from=".U3 > .pin5" to=".U6 > .pin2" />
      <trace from=".U3 > .pin6" to=".U7 > .pin1" />
      <trace from=".U3 > .pin7" to=".U7 > .pin2" />
      <trace from=".U4 > .pin5" to=".U8 > .pin6" />
      <trace from=".U4 > .pin6" to=".U8 > .pin1" />
      <trace from=".U4 > .pin7" to=".U8 > .pin7" />
      <trace from=".U5 > .pin5" to=".U6 > .pin3" />
      <trace from=".U5 > .pin6" to=".U7 > .pin3" />
      <trace from=".U5 > .pin7" to=".U8 > .pin2" />
      <trace from=".U6 > .pin5" to=".U8 > .pin5" />
      <trace from=".U6 > .pin6" to=".U8 > .pin6" />
      <trace from=".U6 > .pin7" to=".J3 > .pin1" />
      <trace from=".U7 > .pin5" to=".J3 > .pin2" />
      <trace from=".U7 > .pin6" to=".J3 > .pin3" />
      <trace from=".U7 > .pin7" to=".J3 > .pin4" />

      <trace from=".U8 > .pin2" to=".J2 > .pin1" />
      <trace from=".U8 > .pin5" to=".J2 > .pin2" />
      <trace from=".U8 > .pin6" to=".J2 > .pin3" />
      <trace from=".U8 > .pin7" to=".J2 > .pin4" />
      <trace from=".U4 > .pin5" to=".R9 > .pin1" />
      <trace from=".R9 > .pin2" to=".J2 > .pin5" />
      <trace from=".U4 > .pin7" to=".R10 > .pin1" />
      <trace from=".R10 > .pin2" to=".J2 > .pin6" />

      <trace from=".U1 > .pin5" to=".R7 > .pin1" />
      <trace from=".R7 > .pin2" to=".D1 > .pos" />
      <trace from=".D1 > .neg" to="net.GND" />
      <trace from=".U2 > .pin5" to=".R8 > .pin1" />
      <trace from=".R8 > .pin2" to=".D2 > .pos" />
      <trace from=".D2 > .neg" to="net.GND" />
      <trace from=".U3 > .pin5" to=".R11 > .pin1" />
      <trace from=".R11 > .pin2" to=".D3 > .pos" />
      <trace from=".D3 > .neg" to="net.GND" />
      <trace from=".U4 > .pin7" to=".R12 > .pin1" />
      <trace from=".R12 > .pin2" to=".D4 > .pos" />
      <trace from=".D4 > .neg" to="net.GND" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
