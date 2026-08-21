import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rp2040PinLabels = {
  pin1: ["IOVDD6"],
  pin10: ["IOVDD5"],
  pin20: ["XIN"],
  pin21: ["XOUT"],
  pin22: ["IOVDD4"],
  pin23: ["DVDD2"],
  pin33: ["IOVDD3"],
  pin42: ["IOVDD2"],
  pin45: ["VREG_VOUT"],
  pin49: ["IOVDD1"],
  pin50: ["DVDD1"],
  pin57: ["GND", "thermalpad"],
} as const

test.failing("RP2040 crystal traces honor their zero-via limit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="27mm">
      <chip
        name="U1"
        pinLabels={rp2040PinLabels}
        footprint="qfn56_thermalpad3.1mmx3.1mm_p0.4001mm_w7.8999mm_h7.9001mm_pw0.2mm_pl0.85mm"
        pcbX={0}
        pcbY={0.5}
      />
      <crystal
        name="Y1"
        frequency="12MHz"
        loadCapacitance="12pF"
        pinVariant="four_pin"
        footprint="crystal"
        maxTraceLength="20mm"
        pcbX={-0.5}
        pcbY={-6}
      />

      <capacitor
        name="C_IOVDD1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-4}
        pcbY={-5}
      />
      <capacitor
        name="C_IOVDD2"
        capacitance="100nF"
        footprint="0402"
        pcbX={-3}
        pcbY={6}
      />
      <capacitor
        name="C_IOVDD3"
        capacitance="100nF"
        footprint="0402"
        pcbX={-8}
        pcbY={-1}
        pcbRotation={-90}
      />
      <capacitor
        name="C_IOVDD4"
        capacitance="100nF"
        footprint="0402"
        pcbX={-4}
        pcbY={-6}
      />
      <capacitor
        name="C_IOVDD5"
        capacitance="100nF"
        footprint="0402"
        pcbX={-6}
        pcbY={-10}
        pcbRotation={-90}
      />
      <capacitor
        name="C_IOVDD6"
        capacitance="100nF"
        footprint="0402"
        pcbX={-8}
        pcbY={1.6}
      />
      <capacitor
        name="C_CORE"
        capacitance="1uF"
        footprint="0402"
        pcbX={3.8}
        pcbY={-5.5}
      />
      <capacitor
        name="C_XIN"
        capacitance="18pF"
        footprint="0402"
        pcbX={-8.4}
        pcbY={-11.8}
      />
      <capacitor
        name="C_XOUT"
        capacitance="18pF"
        footprint="0402"
        pcbX={2.8}
        pcbY={-9}
      />

      <trace name="XIN" from=".Y1 > .pin1" to=".U1 > .XIN" />
      <trace name="XOUT" from=".Y1 > .pin3" to=".U1 > .XOUT" />
      <trace name="CXIN" from=".C_XIN > .pin1" to=".Y1 > .pin1" />
      <trace name="CXOUT" from=".C_XOUT > .pin1" to=".Y1 > .pin3" />
      <trace from=".Y1 > .pin2" to="net.GND" />
      <trace from=".Y1 > .pin4" to="net.GND" />
      <trace from=".C_XIN > .pin2" to="net.GND" />
      <trace from=".C_XOUT > .pin2" to="net.GND" />

      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U1 > .VREG_VOUT" to="net.V1V1" />
      <trace from=".U1 > .DVDD1" to="net.V1V1" />
      <trace from=".U1 > .DVDD2" to="net.V1V1" />
      <trace from=".C_CORE > .pin1" to="net.V1V1" />
      <trace from=".C_CORE > .pin2" to="net.GND" />

      <trace from=".U1 > .IOVDD1" to="net.V3V3" />
      <trace from=".U1 > .IOVDD2" to="net.V3V3" />
      <trace from=".U1 > .IOVDD3" to="net.V3V3" />
      <trace from=".U1 > .IOVDD4" to="net.V3V3" />
      <trace from=".U1 > .IOVDD5" to="net.V3V3" />
      <trace from=".U1 > .IOVDD6" to="net.V3V3" />
      <trace from=".C_IOVDD1 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD1 > .pin2" to="net.GND" />
      <trace from=".C_IOVDD2 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD2 > .pin2" to="net.GND" />
      <trace from=".C_IOVDD3 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD3 > .pin2" to="net.GND" />
      <trace from=".C_IOVDD4 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD4 > .pin2" to="net.GND" />
      <trace from=".C_IOVDD5 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD5 > .pin2" to="net.GND" />
      <trace from=".C_IOVDD6 > .pin1" to="net.V3V3" />
      <trace from=".C_IOVDD6 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
    showErrorsInTextOverlay: true,
    viewport: {
      minX: -10,
      minY: -13,
      maxX: 5,
      maxY: 0,
    },
  })

  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter((error) => error.message.includes("vias")),
  ).toHaveLength(0)
})
