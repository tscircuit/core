import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin20: ["VCC_PLL"],
  pin21: ["REFCLK_OUT"],
  pin22: ["DXOUT"],
  pin23: ["DXIN"],
  pin24: ["X32KOUT"],
  pin25: ["X32KIN"],
  pin26: ["VCC_RTC"],
  pin27: ["RESET"],
  pin28: ["LDOA_OUT"],
  pin29: ["LDO_IN"],
  pin30: ["LDOB_OUT"],
  pin34: ["VCC_PE"],
  pin46: ["VDD_SYS0"],
  pin47: ["DZQ"],
  pin48: ["VCC_DRAM0"],
  pin49: ["VCC_DRAM1"],
  pin50: ["VDD18_DRAM"],
  pin51: ["VDD_SYS1"],
  pin65: ["VCC_LVDS"],
  pin66: ["VCC_PD"],
  pin77: ["VCC_TVOUT"],
  pin78: ["TVOUT0"],
  pin81: ["VDD_SYS2"],
  pin83: ["VCC_IO"],
  pin87: ["MICIN3P"],
  pin88: ["MICIN3N"],
  pin89: ["AVCC"],
  pin90: ["VRA2"],
  pin91: ["AGND"],
  pin92: ["VRA1"],
  pin93: ["FMINR"],
  pin94: ["FMINL"],
  pin95: ["LINEINR"],
  pin96: ["LINEINL"],
  pin97: ["HPVCC"],
} as const

// Reduced from circuits/Core.tsx and circuits/helpers.tsx in:
// https://tscircuit.com/seveibar/allwinner-t113-dev-board#schematic
// Release: db504de9-6618-4f5b-8aea-23a6732a330b
// Keep the upper power pins: removing them moves the LDOA1V8 trunk to the
// other side of GND and no longer reproduces the original analog routing.
test("repro184: Allwinner T113 analog net-label crossing", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={4}>
      <net name="GND" isGroundNet />
      <net name="V3V3" isPowerNet />
      <net name="V0V9" isPowerNet />
      <net name="V1V5" isPowerNet />
      <net name="VRTC1V8" isPowerNet />
      <net name="LDOA1V8" isPowerNet />
      <net name="LDOB_OUT" isPowerNet />

      <chip
        name="U_SOC"
        manufacturerPartNumber="T113-S3"
        pinLabels={pinLabels}
        schX={0}
        schY={0}
        schWidth={3}
        schHeight={20}
        schPinStyle={Object.fromEntries(
          Object.keys(pinLabels).map((pin) => [pin, { marginTop: 0.3 }]),
        )}
        schPinArrangement={{
          leftSide: {
            pins: Object.keys(pinLabels),
            direction: "top-to-bottom",
          },
        }}
        noConnect={[
          "pin78",
          "pin87",
          "pin88",
          "pin93",
          "pin94",
          "pin95",
          "pin96",
        ]}
        pinAttributes={{
          pin20: { requiresPower: true },
          pin26: { requiresPower: true },
          pin28: { requiresPower: false, providesPower: true },
          pin29: { requiresPower: true },
          pin30: { requiresPower: false, providesPower: true },
          pin34: { requiresPower: true },
          pin46: { requiresPower: true },
          pin48: { requiresPower: true },
          pin49: { requiresPower: true },
          pin50: { requiresPower: true },
          pin51: { requiresPower: true },
          pin65: { requiresPower: true },
          pin66: { requiresPower: true },
          pin77: { requiresPower: true },
          pin81: { requiresPower: true },
          pin83: { requiresPower: true },
          pin89: { requiresPower: true },
          pin91: { requiresGround: true },
          pin97: { requiresPower: true },
        }}
      />

      <trace
        from=".U_SOC > .pin20"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
      <trace
        from=".U_SOC > .pin21"
        to="net.REFCLK24M"
        schDisplayLabel="REFCLK24M"
      />
      <trace from=".U_SOC > .pin22" to="net.DXOUT" schDisplayLabel="DXOUT" />
      <trace from=".U_SOC > .pin23" to="net.DXIN" schDisplayLabel="DXIN" />
      <trace
        from=".U_SOC > .pin24"
        to="net.X32KOUT"
        schDisplayLabel="X32KOUT"
      />
      <trace from=".U_SOC > .pin25" to="net.X32KIN" schDisplayLabel="X32KIN" />
      <trace
        from=".U_SOC > .pin26"
        to="net.VRTC1V8"
        schDisplayLabel="VRTC1V8"
      />
      <trace
        from=".U_SOC > .pin27"
        to="net.RESET_N"
        schDisplayLabel="RESET_N"
      />
      <trace
        from=".U_SOC > .pin28"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
      <trace from=".U_SOC > .pin29" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace
        from=".U_SOC > .pin30"
        to="net.LDOB_OUT"
        schDisplayLabel="LDOB_OUT"
      />
      <trace from=".U_SOC > .pin34" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U_SOC > .pin46" to="net.V0V9" schDisplayLabel="V0V9" />
      <trace from=".U_SOC > .pin47" to="net.DDR_ZQ" schDisplayLabel="DDR_ZQ" />
      <trace from=".U_SOC > .pin48" to="net.V1V5" schDisplayLabel="V1V5" />
      <trace from=".U_SOC > .pin49" to="net.V1V5" schDisplayLabel="V1V5" />
      <trace
        from=".U_SOC > .pin50"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
      <trace from=".U_SOC > .pin51" to="net.V0V9" schDisplayLabel="V0V9" />
      <trace
        from=".U_SOC > .pin65"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
      <trace from=".U_SOC > .pin66" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U_SOC > .pin77" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace from=".U_SOC > .pin81" to="net.V0V9" schDisplayLabel="V0V9" />
      <trace from=".U_SOC > .pin83" to="net.V3V3" schDisplayLabel="V3V3" />
      <trace
        from=".U_SOC > .pin89"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
      <trace from=".U_SOC > .pin90" to="net.VRA2" schDisplayLabel="VRA2" />
      <trace from=".U_SOC > .pin91" to="net.GND" schDisplayLabel="GND" />
      <trace from=".U_SOC > .pin92" to="net.VRA1" schDisplayLabel="VRA1" />
      <trace
        from=".U_SOC > .pin97"
        to="net.LDOA1V8"
        schDisplayLabel="LDOA1V8"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const vra1Port = circuit.db.schematic_port.getWhere({ pin_number: 92 })!
  const vra1Trace = circuit.db.schematic_trace
    .list()
    .find((trace) =>
      trace.edges.some(
        (edge) =>
          edge.from.x === vra1Port.center.x &&
          edge.from.y === vra1Port.center.y,
      ),
    )!

  // Measured from the published circuit: horizontal offsets in schematic mm
  // (+X right, +Y up), relative to pin92. VRA1 first crosses the GND stem,
  // then the LDOA1V8 trunk. Pin numbers and rail order must survive reduction.
  // Update this assertion and snapshot when the routing issue is fixed.
  const crossingOffsets = vra1Trace.edges
    .filter((edge) => edge.is_crossing)
    .map((edge) =>
      Number(((edge.from.x + edge.to.x) / 2 - vra1Port.center.x).toFixed(3)),
    )
  expect(crossingOffsets).toEqual([-0.441, -0.821])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 700,
    height: 1400,
  })
})
