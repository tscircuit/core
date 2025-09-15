import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor connection not working", async () => {
  const { circuit } = getTestFixture()

  const BlinkingLedWith555Timer = () => (
    <board width="40mm" height="30mm" autorouter="sequential-trace">
      <chip
        name="U1"
        footprint="dip8_p1.27mm"
        pcbX="-10mm"
        pcbY="0mm"
        pinLabels={{
          1: "GND",
          2: "TRIG",
          3: "OUT",
          4: "RESET",
          5: "CTRL",
          6: "THRES",
          7: "DISCH",
          8: "VCC",
        }}
      />
      <led name="LED1" pcbX="10mm" pcbY="5mm" footprint="0603" />
      <resistor
        name="R1"
        pcbX="-5mm"
        pcbY="-5mm"
        resistance="1k"
        footprint="0603"
      />
      <resistor
        name="R2"
        pcbX="5mm"
        pcbY="-5mm"
        resistance="470"
        footprint="0603"
      />
      <capacitor name="C1" pcbX="10mm" pcbY="-5mm" capacitance="100nF" />

      <trace from=".U1 .VCC" to="net.VCC" />
      <trace from=".U1 .GND" to="net.GND" />
      <trace from="net.VCC" to=".R1 .pin1" />
      <trace from=".R1 .pin2" to=".U1 .DISCH" />
      <trace from=".U1 .DISCH" to=".R2 .pin1" />
      <trace from=".R2 .pin2" to=".LED1 .pin1" />
      <trace from=".LED1 .pin2" to="net.GND" />
      <trace from=".U1 .OUT" to=".C1 .pin1" />
      <trace from=".C1 .pin2" to=".U1 .CTRL" />
      <trace from=".U1 .THRES" to=".U1 .CTRL" />
    </board>
  )

  circuit.add(<BlinkingLedWith555Timer />)

  circuit.render()

  const errors = circuit.db.pcb_trace_error.list()

  expect(errors.map((e) => e.message).join("\n\n")).toContain(
    "Some ports did not have a matching PCB primitive",
  )
})
