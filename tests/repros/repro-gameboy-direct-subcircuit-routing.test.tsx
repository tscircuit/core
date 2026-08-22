import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Gameboy-like board routes through a dense MCU breakout without headers", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="90mm"
      height="54mm"
      layers={2}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
    >
      <subcircuit name="MCU" autorouter="auto">
        <breakout
          name="U1_BREAKOUT"
          autorouter="auto"
          width="30mm"
          height="42mm"
        >
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
          <breakoutpoint connection=".U1 > .GPIO0" pcbX={-14.9999} pcbY={4} />
          <breakoutpoint connection=".U1 > .GPIO1" pcbX={-14.9999} pcbY={2} />
          <breakoutpoint connection=".U1 > .GPIO2" pcbX={-14.9999} pcbY={0} />
          <breakoutpoint connection=".U1 > .GPIO3" pcbX={-14.9999} pcbY={-2} />
          <breakoutpoint connection=".U1 > .GPIO4" pcbX={-14.9999} pcbY={-4} />
          <breakoutpoint connection=".U1 > .GPIO25" pcbX={14.9999} pcbY={-4} />
          <breakoutpoint
            connection=".U1 > .GPIO26_ADC0"
            pcbX={14.9999}
            pcbY={-2}
          />
          <breakoutpoint
            connection=".U1 > .GPIO27_ADC1"
            pcbX={14.9999}
            pcbY={0}
          />
          <breakoutpoint
            connection=".U1 > .GPIO28_ADC2"
            pcbX={14.9999}
            pcbY={2}
          />
          <breakoutpoint
            connection=".U1 > .GPIO29_ADC3"
            pcbX={14.9999}
            pcbY={4}
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
          <trace
            name="QSPI_IOVDD_V3V3"
            from=".U1 > .QSPI_IOVDD"
            to="net.V3V3"
          />
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
        </breakout>
      </subcircuit>

      <chip
        name="U_CONTROLS"
        footprint="soic16"
        pinLabels={{
          pin1: "GPIO0",
          pin2: "GPIO1",
          pin3: "GPIO2",
          pin4: "GPIO3",
          pin5: "GPIO4",
        }}
        pcbX={-34}
        pcbY={0}
        pcbRotation={90}
      />
      <chip
        name="U_DISPLAY_AUDIO"
        footprint="soic16"
        pinLabels={{
          pin1: "GPIO25",
          pin2: "GPIO26_ADC0",
          pin3: "GPIO27_ADC1",
          pin4: "GPIO28_ADC2",
          pin5: "GPIO29_ADC3",
          pin6: "NC1",
          pin7: "NC2",
        }}
        pcbX={34}
        pcbY={0}
        pcbRotation={90}
      />

      <trace
        name="LEFT_GPIO0"
        from=".U_CONTROLS > .GPIO0"
        to=".MCU .U1 > .GPIO0"
      />
      <trace
        name="LEFT_GPIO1"
        from=".U_CONTROLS > .GPIO1"
        to=".MCU .U1 > .GPIO1"
      />
      <trace
        name="LEFT_GPIO2"
        from=".U_CONTROLS > .GPIO2"
        to=".MCU .U1 > .GPIO2"
      />
      <trace
        name="LEFT_GPIO3"
        from=".U_CONTROLS > .GPIO3"
        to=".MCU .U1 > .GPIO3"
      />
      <trace
        name="LEFT_GPIO4"
        from=".U_CONTROLS > .GPIO4"
        to=".MCU .U1 > .GPIO4"
      />
      <trace
        name="RIGHT_GPIO25"
        from=".U_DISPLAY_AUDIO > .GPIO25"
        to=".MCU .U1 > .GPIO25"
      />
      <trace
        name="RIGHT_GPIO26_ADC0"
        from=".U_DISPLAY_AUDIO > .GPIO26_ADC0"
        to=".MCU .U1 > .GPIO26_ADC0"
      />
      <trace
        name="RIGHT_GPIO27_ADC1"
        from=".U_DISPLAY_AUDIO > .GPIO27_ADC1"
        to=".MCU .U1 > .GPIO27_ADC1"
      />
      <trace
        name="RIGHT_GPIO28_ADC2"
        from=".U_DISPLAY_AUDIO > .GPIO28_ADC2"
        to=".MCU .U1 > .GPIO28_ADC2"
      />
      <trace
        name="RIGHT_GPIO29_ADC3"
        from=".U_DISPLAY_AUDIO > .GPIO29_ADC3"
        to=".MCU .U1 > .GPIO29_ADC3"
      />

      <pcbnotetext
        pcbX={0}
        pcbY={25}
        fontSize={1.1}
        text="MCU virtual breakout routing (no physical headers)"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingPhaseIoStack).toHaveLength(2)
  const [breakoutPhase, parentPhase] = autoroutingPhaseIoStack
  expect(breakoutPhase?.startSimpleRouteJson?.connections).toHaveLength(23)
  expect(breakoutPhase?.endSimpleRouteJson?.traces?.length).toBeGreaterThan(23)
  expect(parentPhase?.startSimpleRouteJson?.connections).toHaveLength(10)
  expect(parentPhase?.startSimpleRouteJson?.traces?.length).toBe(
    breakoutPhase?.endSimpleRouteJson?.traces?.length,
  )
  const parentPreloadedViaPoints =
    parentPhase?.startSimpleRouteJson?.traces?.flatMap((trace) =>
      trace.route.filter((routePoint) => routePoint.route_type === "via"),
    ) ?? []
  expect(parentPreloadedViaPoints.length).toBeGreaterThan(0)
  expect(
    parentPreloadedViaPoints.every(
      (viaPoint) =>
        !parentPhase?.startSimpleRouteJson?.obstacles.some(
          (obstacle) =>
            obstacle.circuitJsonMetadata?.pcb_via_id !== undefined &&
            obstacle.center.x === viaPoint.x &&
            obstacle.center.y === viaPoint.y,
        ),
    ),
  ).toBe(true)
  expect(parentPhase?.endSimpleRouteJson?.traces).toHaveLength(10)
  expect(
    parentPhase?.startSimpleRouteJson?.connections.every((connection) =>
      connection.pointsToConnect.some((point) =>
        point.pointId?.startsWith("pcb_breakout_point_"),
      ),
    ),
  ).toBe(true)

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
}, 120_000)
