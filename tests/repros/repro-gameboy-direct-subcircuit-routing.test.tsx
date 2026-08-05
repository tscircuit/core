import { expect, test } from "bun:test"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const mcuPinLabels = {
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
  pin61: "GND",
} as const

const gpioPins = [
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

const leftIoPins = gpioPins.slice(0, 5)
const rightIoPins = gpioPins.slice(25)

const createPinLabels = (labels: readonly string[]) =>
  Object.fromEntries(labels.map((label, index) => [`pin${index + 1}`, label]))

const DenseQfn60Mcu = () => {
  const perimeterPads = Array.from({ length: 60 }, (_, index) => {
    const pinNumber = index + 1
    const side = Math.floor(index / 15)
    const sideIndex = index % 15
    const offset = 2.8 - sideIndex * 0.4

    const position =
      side === 0
        ? { pcbX: -3.575, pcbY: offset, width: 0.875, height: 0.2 }
        : side === 1
          ? { pcbX: -offset, pcbY: -3.575, width: 0.2, height: 0.875 }
          : side === 2
            ? { pcbX: 3.575, pcbY: -offset, width: 0.875, height: 0.2 }
            : { pcbX: offset, pcbY: 3.575, width: 0.2, height: 0.875 }

    return (
      <Fragment key={pinNumber}>
        <smtpad
          portHints={[`pin${pinNumber}`]}
          shape="rect"
          pcbX={position.pcbX}
          pcbY={position.pcbY}
          width={position.width}
          height={position.height}
        />
      </Fragment>
    )
  })

  return (
    <chip
      name="U1"
      pinLabels={mcuPinLabels}
      pcbX={0}
      pcbY={0}
      footprint={
        <footprint>
          {perimeterPads}
          <smtpad
            portHints={["pin61"]}
            shape="rect"
            width="3.4mm"
            height="3.4mm"
          />
        </footprint>
      }
    />
  )
}

const GenericMcuSubcircuit = () => (
  <subcircuit name="MCU">
    <net name="V3V3" />
    <net name="V1V1" />
    <net name="GND" />

    <DenseQfn60Mcu />

    <chip
      name="U_FLASH"
      footprint="soic8"
      pinLabels={createPinLabels([
        "CS",
        "SD1",
        "SD2",
        "GND",
        "SD0",
        "SCLK",
        "SD3",
        "VCC",
      ])}
      pcbX={10}
      pcbY={3}
    />
    <chip
      name="U_USB"
      footprint="soic8"
      pinLabels={createPinLabels([
        "DM",
        "DP",
        "VBUS",
        "GND",
        "CC1",
        "CC2",
        "SH1",
        "SH2",
      ])}
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

    {[
      "IOVDD1",
      "IOVDD2",
      "IOVDD3",
      "IOVDD4",
      "IOVDD5",
      "IOVDD6",
      "ADC_AVDD",
      "VREG_VIN",
      "VREG_AVDD",
      "USB_OTP_VDD",
      "QSPI_IOVDD",
    ].map((pin) => (
      <Fragment key={pin}>
        <trace name={`${pin}_V3V3`} from={`.U1 > .${pin}`} to="net.V3V3" />
      </Fragment>
    ))}
    {(["DVDD1", "DVDD2", "DVDD3", "VREG_FB"] as const).map((pin) => (
      <Fragment key={pin}>
        <trace name={`${pin}_V1V1`} from={`.U1 > .${pin}`} to="net.V1V1" />
      </Fragment>
    ))}
    <trace from=".U1 > .GND" to="net.GND" />
    <trace from=".U1 > .VREG_PGND" to="net.GND" />
    <trace from=".U1 > .VREG_LX" to="net.V1V1" />
    {(["C1", "C2", "C3", "C4"] as const).map((name) => (
      <Fragment key={name}>
        <trace name={`${name}_P`} from={`.${name} > .pin1`} to="net.V3V3" />
        <trace name={`${name}_G`} from={`.${name} > .pin2`} to="net.GND" />
      </Fragment>
    ))}

    <trace from=".U1 > .USB_DM" to=".R_USB_DM > .pin1" />
    <trace from=".R_USB_DM > .pin2" to=".U_USB > .DM" />
    <trace from=".U1 > .USB_DP" to=".R_USB_DP > .pin1" />
    <trace from=".R_USB_DP > .pin2" to=".U_USB > .DP" />
    <trace from=".U_USB > .VBUS" to="net.V3V3" />
    <trace from=".U_USB > .GND" to="net.GND" />
  </subcircuit>
)

test.failing(
  "Gameboy-like board routes directly to a dense MCU subcircuit without headers",
  async () => {
    const { circuit } = getTestFixture()
    const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

    circuit.add(
      <board
        outline={[
          { x: -45, y: 22 },
          { x: -42, y: 27 },
          { x: 42, y: 27 },
          { x: 45, y: 22 },
          { x: 43, y: -24 },
          { x: 30, y: -27 },
          { x: -30, y: -27 },
          { x: -43, y: -24 },
        ]}
        layers={2}
        minTraceWidth="0.1mm"
        defaultTraceWidth="0.1mm"
        minTraceToPadEdgeClearance="0.1mm"
        minViaEdgeToPadEdgeClearance="0.1mm"
        minViaHoleDiameter="0.2mm"
        minViaPadDiameter="0.45mm"
      >
        <GenericMcuSubcircuit />

        <chip
          name="U_CONTROLS"
          footprint="soic16"
          pinLabels={createPinLabels(leftIoPins)}
          pcbX={-34}
          pcbY={0}
          pcbRotation={90}
        />
        <chip
          name="U_DISPLAY_AUDIO"
          footprint="soic16"
          pinLabels={createPinLabels([...rightIoPins, "NC1", "NC2"])}
          pcbX={34}
          pcbY={0}
          pcbRotation={90}
        />

        {leftIoPins.map((gpio) => (
          <Fragment key={`LEFT_${gpio}`}>
            <trace
              name={`LEFT_${gpio}`}
              from={`.U_CONTROLS > .${gpio}`}
              to={`.MCU .U1 > .${gpio}`}
            />
          </Fragment>
        ))}
        {rightIoPins.map((gpio) => (
          <Fragment key={`RIGHT_${gpio}`}>
            <trace
              name={`RIGHT_${gpio}`}
              from={`.U_DISPLAY_AUDIO > .${gpio}`}
              to={`.MCU .U1 > .${gpio}`}
            />
          </Fragment>
        ))}

        <pcbnotetext
          pcbX={0}
          pcbY={25}
          fontSize={1.1}
          text="BUG: direct board-to-MCU routing after dense child routing (no headers)"
        />
      </board>,
    )

    await circuit.renderUntilSettled()

    expect(autoroutingPhaseIoStack.length).toBeGreaterThanOrEqual(2)
    const parentPhase = autoroutingPhaseIoStack.at(-1)
    expect(parentPhase?.startSimpleRouteJson?.connections).toHaveLength(10)
    expect(parentPhase?.startSimpleRouteJson?.traces?.length).toBeGreaterThan(
      30,
    )
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    // Desired behavior: the direct board-to-MCU routes complete without a
    // breakout component. This currently fails with "$F ran out of iterations".
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
    expect(circuit.db.pcb_trace_error.list()).toEqual([])
    expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
    expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  },
  120_000,
)
