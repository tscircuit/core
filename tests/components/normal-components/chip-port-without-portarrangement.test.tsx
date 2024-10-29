import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bug high port number", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="25mm" schAutoLayoutEnabled>
      <chip
        name="U1"
        footprint="soic8"
        pcbX="-10mm"
        pcbY="0mm"
        pinLabels={{
          1: "OUT1",
          2: "OUT2",
          3: "OUT3",
          4: "OUT4",
          5: "VCC",
          6: "IN1",
          7: "IN2",
          8: "GND",
        }}
      />

      <diode name="D1" footprint="sod123" pcbX="-5mm" pcbY="5mm" />
      <diode name="D2" footprint="sod123" pcbX="-5mm" pcbY="-5mm" />
      <capacitor
        name="C1"
        footprint="0805"
        pcbX="5mm"
        pcbY="5mm"
        capacitance="100nF"
      />
      <capacitor
        name="C2"
        footprint="0805"
        pcbX="5mm"
        pcbY="-5mm"
        capacitance="100nF"
      />

      <trace from=".U1 .VCC" to=".C1 .pin1" />
      <trace from=".C1 .pin2" to=".C2 .pin1" />
      <trace from=".C2 .pin2" to="net.GND" />
      <trace from=".U1 .OUT1" to=".D1 .pin1" />
      <trace from=".D1 .pin2" to="net.MOUT1" />
      <trace from=".U1 .OUT2" to=".D2 .pin1" />
      <trace from=".D2 .pin2" to="net.MOUT2" />
    </board>,
  )

  circuit.render()

  expect(circuit.selectOne("capacitor")).not.toBeNull()
  expect(circuit.selectOne("diode")).not.toBeNull()
  expect(circuit.selectOne("chip[name='U1']")).not.toBeNull()

  // Check if traces are created
  expect(circuit.selectAll("trace").length).toBe(7)

  // Generate and check PCB snapshot
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
