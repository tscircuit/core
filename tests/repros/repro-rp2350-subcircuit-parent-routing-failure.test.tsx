import { expect, test } from "bun:test"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const reproduceParentRoutingFailure =
  process.env.RUN_RP2350_SUBCIRCUIT_PARENT_FAILURE === "1"

const leftGpioSignals = [
  "GPIO0",
  "GPIO1",
  "GPIO2",
  "GPIO3",
  "GPIO4",
  "GPIO5",
  "GPIO6",
  "GPIO7",
  "GPIO8",
  "GPIO9",
  "GPIO10",
  "GPIO11",
  "GPIO12",
  "GPIO13",
  "GPIO14",
] as const

const rightGpioSignals = [
  "GPIO15",
  "GPIO16",
  "GPIO17",
  "GPIO18",
  "GPIO19",
  "GPIO20",
  "GPIO21",
  "GPIO22",
  "GPIO23",
  "GPIO24",
  "GPIO25",
  "GPIO26_ADC0",
  "GPIO27_ADC1",
  "GPIO28_ADC2",
  "GPIO29_ADC3",
] as const

const debugSignals = ["SWCLK", "SWDIO", "RUN"] as const

/**
 * Normal CI runs route the child with the real autorouter, then preserve the
 * board-phase SRJ with a pass-through solver. Run the real failing parent with:
 *
 * RUN_RP2350_SUBCIRCUIT_PARENT_FAILURE=1 bun test \
 *   tests/repros/repro-rp2350-subcircuit-parent-routing-failure.test.tsx
 */
test("RP2350 child routing leaves the parent unable to reach its pads", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="90mm"
      height="54mm"
      layers={2}
      autorouter={
        reproduceParentRoutingFailure
          ? "auto"
          : {
              local: true,
              groupMode: "subcircuit",
              algorithmFn: createBasicAutorouter(async (simpleRouteJson) =>
                structuredClone(simpleRouteJson.traces ?? []),
              ),
            }
      }
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
    >
      <subcircuit name="MCU" autorouter="auto">
        <net name="V3V3" />
        <net name="V1V1" />
        <net name="GND" />

        <chip
          name="U1"
          pinLabels={{
            pin1: "IOVDD6",
            pin2: "GPIO0",
            pin3: "GPIO1",
            pin4: "GPIO2",
            pin5: "GPIO3",
            pin6: "DVDD3",
            pin7: "GPIO4",
            pin8: "GPIO5",
            pin9: "GPIO6",
            pin10: "GPIO7",
            pin11: "IOVDD5",
            pin12: "GPIO8",
            pin13: "GPIO9",
            pin14: "GPIO10",
            pin15: "GPIO11",
            pin16: "GPIO12",
            pin17: "GPIO13",
            pin18: "GPIO14",
            pin19: "GPIO15",
            pin20: "IOVDD4",
            pin21: "XIN",
            pin22: "XOUT",
            pin23: "DVDD2",
            pin24: "SWCLK",
            pin25: "SWDIO",
            pin26: "RUN",
            pin27: "GPIO16",
            pin28: "GPIO17",
            pin29: "GPIO18",
            pin30: "IOVDD3",
            pin31: "GPIO19",
            pin32: "GPIO20",
            pin33: "GPIO21",
            pin34: "GPIO22",
            pin35: "GPIO23",
            pin36: "GPIO24",
            pin37: "GPIO25",
            pin38: "IOVDD2",
            pin39: "DVDD1",
            pin40: "GPIO26_ADC0",
            pin41: "GPIO27_ADC1",
            pin42: "GPIO28_ADC2",
            pin43: "GPIO29_ADC3",
            pin44: "ADC_AVDD",
            pin45: "IOVDD1",
            pin46: "VREG_AVDD",
            pin47: "VREG_PGND",
            pin48: "VREG_LX",
            pin49: "VREG_VIN",
            pin50: "VREG_FB",
            pin51: "USB_DM",
            pin52: "USB_DP",
            pin53: "USB_OTP_VDD",
            pin54: "QSPI_IOVDD",
            pin55: "QSPI_SD3",
            pin56: "QSPI_SCLK",
            pin57: "QSPI_SD0",
            pin58: "QSPI_SD2",
            pin59: "QSPI_SD1",
            pin60: "QSPI_SS",
            pin61: ["GND", "thermalpad"],
          }}
          pcbX={0}
          pcbY={0}
          footprint="qfn60_thermalpad3.4mmx3.4mm_p0.4mm_w8.225mm_h8.225mm_pw0.2mm_pl0.875mm"
        />

        <chip
          name="U_FLASH"
          footprint="soic8"
          pinLabels={{
            pin1: "CS",
            pin2: "SD1",
            pin3: "SD2",
            pin4: "GND",
            pin5: "SD0",
            pin6: "SCLK",
            pin7: "SD3",
            pin8: "VCC",
          }}
          pcbX={10}
          pcbY={3}
        />
        <chip
          name="U_USB"
          footprint="soic8"
          pinLabels={{
            pin1: "DM",
            pin2: "DP",
            pin3: "VBUS",
            pin4: "GND",
            pin5: "CC1",
            pin6: "CC2",
            pin7: "SH1",
            pin8: "SH2",
          }}
          pcbX={0}
          pcbY={-17}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={-7}
          pcbY={5}
        />
        <capacitor
          name="C2"
          capacitance="100nF"
          footprint="0402"
          pcbX={-7}
          pcbY={1.7}
        />
        <capacitor
          name="C3"
          capacitance="100nF"
          footprint="0402"
          pcbX={-7}
          pcbY={-1.7}
        />
        <capacitor
          name="C4"
          capacitance="100nF"
          footprint="0402"
          pcbX={-7}
          pcbY={-5}
        />
        <resistor
          name="R_USB_DM"
          resistance="27"
          footprint="0402"
          pcbX={-2}
          pcbY={-10}
        />
        <resistor
          name="R_USB_DP"
          resistance="27"
          footprint="0402"
          pcbX={2}
          pcbY={-10}
        />

        <trace from=".U1 > .QSPI_SS" to=".U_FLASH > .CS" />
        <trace from=".U1 > .QSPI_SD0" to=".U_FLASH > .SD0" />
        <trace from=".U1 > .QSPI_SD1" to=".U_FLASH > .SD1" />
        <trace from=".U1 > .QSPI_SD2" to=".U_FLASH > .SD2" />
        <trace from=".U1 > .QSPI_SD3" to=".U_FLASH > .SD3" />
        <trace from=".U1 > .QSPI_SCLK" to=".U_FLASH > .SCLK" />
        <trace from=".U_FLASH > .VCC" to="net.V3V3" />
        <trace from=".U_FLASH > .GND" to="net.GND" />

        <trace name="IOVDD1_V3V3" from=".U1 > .IOVDD1" to="net.V3V3" />
        <trace name="IOVDD2_V3V3" from=".U1 > .IOVDD2" to="net.V3V3" />
        <trace name="IOVDD3_V3V3" from=".U1 > .IOVDD3" to="net.V3V3" />
        <trace name="IOVDD4_V3V3" from=".U1 > .IOVDD4" to="net.V3V3" />
        <trace name="IOVDD5_V3V3" from=".U1 > .IOVDD5" to="net.V3V3" />
        <trace name="IOVDD6_V3V3" from=".U1 > .IOVDD6" to="net.V3V3" />
        <trace name="ADC_AVDD_V3V3" from=".U1 > .ADC_AVDD" to="net.V3V3" />
        <trace name="VREG_VIN_V3V3" from=".U1 > .VREG_VIN" to="net.V3V3" />
        <trace name="VREG_AVDD_V3V3" from=".U1 > .VREG_AVDD" to="net.V3V3" />
        <trace
          name="USB_OTP_VDD_V3V3"
          from=".U1 > .USB_OTP_VDD"
          to="net.V3V3"
        />
        <trace name="QSPI_IOVDD_V3V3" from=".U1 > .QSPI_IOVDD" to="net.V3V3" />
        <trace name="DVDD1_V1V1" from=".U1 > .DVDD1" to="net.V1V1" />
        <trace name="DVDD2_V1V1" from=".U1 > .DVDD2" to="net.V1V1" />
        <trace name="DVDD3_V1V1" from=".U1 > .DVDD3" to="net.V1V1" />
        <trace name="VREG_FB_V1V1" from=".U1 > .VREG_FB" to="net.V1V1" />
        <trace from=".U1 > .GND" to="net.GND" />
        <trace from=".U1 > .VREG_PGND" to="net.GND" />
        <trace from=".U1 > .VREG_LX" to="net.V1V1" />
        <trace name="C1_P" from=".C1 > .pin1" to="net.V3V3" />
        <trace name="C1_G" from=".C1 > .pin2" to="net.GND" />
        <trace name="C2_P" from=".C2 > .pin1" to="net.V3V3" />
        <trace name="C2_G" from=".C2 > .pin2" to="net.GND" />
        <trace name="C3_P" from=".C3 > .pin1" to="net.V3V3" />
        <trace name="C3_G" from=".C3 > .pin2" to="net.GND" />
        <trace name="C4_P" from=".C4 > .pin1" to="net.V3V3" />
        <trace name="C4_G" from=".C4 > .pin2" to="net.GND" />
        <trace from=".U1 > .USB_DM" to=".R_USB_DM > .pin1" />
        <trace from=".R_USB_DM > .pin2" to=".U_USB > .DM" />
        <trace from=".U1 > .USB_DP" to=".R_USB_DP > .pin1" />
        <trace from=".R_USB_DP > .pin2" to=".U_USB > .DP" />
        <trace from=".U_USB > .VBUS" to="net.V3V3" />
        <trace from=".U_USB > .GND" to="net.GND" />
      </subcircuit>

      <chip
        name="U_LEFT_BANK"
        footprint="tssop16"
        pinLabels={Object.fromEntries(
          leftGpioSignals.map((signal, signalIndex) => [
            `pin${signalIndex + 1}`,
            signal,
          ]),
        )}
        pcbX={-34}
        pcbY={0}
        pcbRotation={90}
      />
      <chip
        name="U_RIGHT_BANK"
        footprint="tssop16"
        pinLabels={Object.fromEntries(
          rightGpioSignals.map((signal, signalIndex) => [
            `pin${signalIndex + 1}`,
            signal,
          ]),
        )}
        pcbX={34}
        pcbY={0}
        pcbRotation={90}
      />
      <chip
        name="U_DEBUG"
        footprint="soic8"
        pinLabels={Object.fromEntries(
          debugSignals.map((signal, signalIndex) => [
            `pin${signalIndex + 1}`,
            signal,
          ]),
        )}
        pcbX={0}
        pcbY={22}
      />

      {leftGpioSignals.map((signal) => (
        <Fragment key={`LEFT_${signal}`}>
          <trace
            name={`LEFT_${signal}`}
            from={`.U_LEFT_BANK > .${signal}`}
            to={`.MCU .U1 > .${signal}`}
          />
        </Fragment>
      ))}
      {rightGpioSignals.map((signal) => (
        <Fragment key={`RIGHT_${signal}`}>
          <trace
            name={`RIGHT_${signal}`}
            from={`.U_RIGHT_BANK > .${signal}`}
            to={`.MCU .U1 > .${signal}`}
          />
        </Fragment>
      ))}
      {debugSignals.map((signal) => (
        <Fragment key={`DEBUG_${signal}`}>
          <trace
            name={`DEBUG_${signal}`}
            from={`.U_DEBUG > .${signal}`}
            to={`.MCU .U1 > .${signal}`}
          />
        </Fragment>
      ))}

      <pcbnotetext
        pcbX={0}
        pcbY={-25}
        fontSize={1.1}
        text="RP2350 child routes first; parent connects directly to QFN pads; no breakout points"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingPhaseIoStack).toHaveLength(2)
  const [subcircuitPhase, parentPhase] = autoroutingPhaseIoStack
  expect(subcircuitPhase?.startSimpleRouteJson?.connections).toHaveLength(13)
  expect(subcircuitPhase?.endSimpleRouteJson?.traces?.length).toBeGreaterThan(
    13,
  )
  expect(parentPhase?.startSimpleRouteJson?.connections).toHaveLength(33)
  expect(parentPhase?.startSimpleRouteJson?.traces?.length).toBe(
    subcircuitPhase?.endSimpleRouteJson?.traces?.length,
  )
  expect(
    parentPhase?.startSimpleRouteJson?.connections.some((connection) =>
      connection.pointsToConnect.some((point) =>
        point.pointId?.startsWith("pcb_breakout_point_"),
      ),
    ),
  ).toBe(false)

  if (!reproduceParentRoutingFailure) {
    await expect(
      autoroutingPhaseIoStack,
    ).toMatchAutoroutingPhaseIoStackSnapshot(
      import.meta.path,
      "repro-rp2350-subcircuit-parent-routing-failure-srj",
      circuit,
    )
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
}, 120_000)
