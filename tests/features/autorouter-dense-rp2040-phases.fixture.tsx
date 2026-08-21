import type { AutorouterVersion } from "lib/utils/autorouting/autorouter-version"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const capacitors = [
  { name: "C1", pcbX: 10.8, pcbY: 5.5 },
  { name: "C2", pcbX: 10.8, pcbY: 1.8 },
  { name: "C3", pcbX: 10.8, pcbY: -1.8 },
  { name: "C4", pcbX: 4.5, pcbY: 8.5 },
  { name: "C5", pcbX: 0, pcbY: 8.5 },
  { name: "C6", pcbX: -4.5, pcbY: 8.5 },
  { name: "C7", pcbX: -10.8, pcbY: 4.8 },
  { name: "C8", pcbX: -10.8, pcbY: 1.2 },
  { name: "C9", pcbX: -10.8, pcbY: -2.4 },
  { name: "C10", pcbX: 13.5, pcbY: -4.5 },
] as const

// Model the tightly packed USB/boot support passives that narrow the escape
// channel between the connector and flash without adding another routed phase.
const supportResistors = Array.from({ length: 8 }, (_, index) => ({
  name: `R${index + 1}`,
  pcbX: -3.5 + index * 1.2,
  pcbY: -8.7,
}))

const rp2040Connections = [
  { pin: "GPIO0", pinNumber: 2, to: ".C1 > .pin1" },
  { pin: "GPIO5", pinNumber: 7, to: ".C2 > .pin1" },
  { pin: "GPIO9", pinNumber: 12, to: ".C3 > .pin1" },
  { pin: "GPIO14", pinNumber: 17, to: ".C4 > .pin1" },
  { pin: "XOUT", pinNumber: 21, to: ".C5 > .pin1" },
  { pin: "GPIO16", pinNumber: 27, to: ".C6 > .pin1" },
  { pin: "GPIO21", pinNumber: 32, to: ".C7 > .pin1" },
  { pin: "GPIO27", pinNumber: 39, to: ".C8 > .pin1" },
  { pin: "VREG_VIN", pinNumber: 44, to: ".C9 > .pin1" },
  { pin: "VREG_VOUT", pinNumber: 45, to: ".C10 > .pin1" },
  { pin: "QSPI_SD3", pinNumber: 51, to: ".U2 > .HOLD_IO3" },
  { pin: "QSPI_SCLK", pinNumber: 52, to: ".U2 > .SCK" },
  { pin: "QSPI_SD0", pinNumber: 53, to: ".U2 > .MOSI" },
  { pin: "QSPI_SD2", pinNumber: 54, to: ".U2 > .WP_IO2" },
  { pin: "QSPI_SD1", pinNumber: 55, to: ".U2 > .MISO" },
  { pin: "QSPI_SS", pinNumber: 56, to: ".U2 > .SSEL" },
  { pin: "USB_DM", pinNumber: 46, to: ".J1 > .DM1" },
  { pin: "USB_DP", pinNumber: 47, to: ".J1 > .DP1" },
] as const

const rp2040PinLabels = Object.fromEntries(
  rp2040Connections.map(({ pin, pinNumber }) => [`pin${pinNumber}`, pin]),
)

const flashPinLabels = {
  pin1: "SCK",
  pin2: "MOSI",
  pin3: "MISO",
  pin4: "SSEL",
  pin5: "WP_IO2",
  pin6: "HOLD_IO3",
  pin7: "VSS",
  pin8: "VCC",
} as const

const usbCPinLabels = {
  pin1: "GND1",
  pin2: "GND2",
  pin3: "VBUS1",
  pin4: "VBUS2",
  pin5: "SBU2",
  pin6: "CC1",
  pin7: "DM2",
  pin8: "DP1",
  pin9: "DM1",
  pin10: "DP2",
  pin11: "SBU1",
  pin12: "CC2",
  pin13: "VBUS3",
  pin14: "VBUS4",
  pin15: "GND3",
  pin16: "GND4",
} as const

const AutoroutingPhase = ({ phaseIndex }: { phaseIndex: number }) => (
  <autoroutingphase
    phaseIndex={phaseIndex}
    name={`route-dense-rp2040-connection-${phaseIndex + 1}`}
  />
)

const PhasedTrace = ({
  phaseIndex,
  pin,
  to,
}: {
  phaseIndex?: number
  pin: string
  to: string
}) => (
  <trace
    name={`PHASE_${phaseIndex}_${pin}`}
    from={`.U1 > .${pin}`}
    to={to}
    routingPhaseIndex={phaseIndex}
  />
)

const UsbSignalPad = ({ pinNumber }: { pinNumber: number }) => (
  <smtpad
    portHints={[`pin${pinNumber}`]}
    pcbX={(pinNumber - 1 - 5.5) * 0.5}
    pcbY={1.8}
    width={0.3}
    height={1.2}
    shape="rect"
  />
)

const usbCFootprint = (
  <footprint>
    {Array.from({ length: 12 }, (_, index) => (
      <UsbSignalPad key={`usb-signal-${index + 1}`} pinNumber={index + 1} />
    ))}
    <platedhole
      portHints={["pin13"]}
      pcbX={-4}
      pcbY={1}
      outerWidth={1.2}
      outerHeight={1.8}
      holeWidth={0.8}
      holeHeight={1.4}
      shape="pill"
    />
    <platedhole
      portHints={["pin14"]}
      pcbX={4}
      pcbY={1}
      outerWidth={1.2}
      outerHeight={1.8}
      holeWidth={0.8}
      holeHeight={1.4}
      shape="pill"
    />
    <platedhole
      portHints={["pin15"]}
      pcbX={-4}
      pcbY={-1.5}
      outerWidth={1.2}
      outerHeight={1.8}
      holeWidth={0.8}
      holeHeight={1.4}
      shape="pill"
    />
    <platedhole
      portHints={["pin16"]}
      pcbX={4}
      pcbY={-1.5}
      outerWidth={1.2}
      outerHeight={1.8}
      holeWidth={0.8}
      holeHeight={1.4}
      shape="pill"
    />
  </footprint>
)

export const DENSE_RP2040_PHASE_COUNT = rp2040Connections.length

const createDenseRp2040Circuit = (
  autorouterVersion: AutorouterVersion,
  routingMode: "phased" | "unphased",
) => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const autoroutingSolverNames: string[] = []
  circuit.on("solver:started", ({ solverName }) => {
    if (solverName.startsWith("AutoroutingPipelineSolver")) {
      autoroutingSolverNames.push(solverName)
    }
  })

  circuit.add(
    <board
      width="32mm"
      height="24mm"
      autorouterVersion={autorouterVersion}
      minTraceWidth="0.15mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.15mm"
      minViaEdgeToPadEdgeClearance="0.15mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.15mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      {routingMode === "phased" &&
        rp2040Connections.map(({ pinNumber }, phaseIndex) => (
          <AutoroutingPhase
            key={`phase-${pinNumber}`}
            phaseIndex={phaseIndex}
          />
        ))}

      <chip
        name="U1"
        manufacturerPartNumber="RP2040"
        footprint="qfn56"
        pinLabels={rp2040PinLabels}
        pcbX={0}
        pcbY={0}
      />

      <chip
        name="U2"
        manufacturerPartNumber="8MB QSPI Flash"
        footprint="soic8"
        pinLabels={flashPinLabels}
        pcbX={9}
        pcbY={-7.5}
        pcbRotation={90}
      />

      <connector
        name="J1"
        manufacturerPartNumber="TYPE-C-16P"
        footprint={usbCFootprint}
        pinLabels={usbCPinLabels}
        pcbX={-9}
        pcbY={-8}
      />

      {capacitors.map(({ name, pcbX, pcbY }) => (
        <capacitor
          key={name}
          name={name}
          capacitance="100nF"
          footprint="0402"
          pcbX={pcbX}
          pcbY={pcbY}
        />
      ))}

      {supportResistors.map(({ name, pcbX, pcbY }) => (
        <resistor
          key={name}
          name={name}
          resistance="1k"
          footprint="0402"
          pcbX={pcbX}
          pcbY={pcbY}
          pcbRotation={90}
        />
      ))}

      {rp2040Connections.map(({ pin, pinNumber, to }, phaseIndex) => (
        <PhasedTrace
          key={`trace-${pinNumber}`}
          phaseIndex={routingMode === "phased" ? phaseIndex : undefined}
          pin={pin}
          to={to}
        />
      ))}

      <pcbnotetext
        pcbX={0}
        pcbY={10.5}
        fontSize={routingMode === "phased" ? 0.45 : 0.6}
        text={
          routingMode === "phased"
            ? `${autorouterVersion}: RP2040 + flash + USB-C, one trace per phase`
            : `${autorouterVersion === "beta_pipeline7" ? "PIPELINE 7" : "PIPELINE 9"}: UNPHASED, ALL 18 CONNECTIONS TOGETHER`
        }
      />
    </board>,
  )

  return { circuit, autoroutingPhaseIoStack, autoroutingSolverNames }
}

export const createDenseRp2040PhasedCircuit = (
  autorouterVersion: AutorouterVersion,
) => createDenseRp2040Circuit(autorouterVersion, "phased")

export const createDenseRp2040UnphasedCircuit = (
  autorouterVersion: AutorouterVersion,
) => createDenseRp2040Circuit(autorouterVersion, "unphased")
