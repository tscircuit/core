import {
  MT53E1G16D1ZW,
  ballMap,
} from "@tsci/0hmX.mt53e1g16d1zw-footprint/lib/MT53E1G16D1ZW.tsx"
import { AM62L32 } from "@tsci/tscircuit.ti-am62l-fixture/lib/chips/AM62L32.circuit.tsx"
import { Fragment } from "react"

export type DdrBusName = "DDR_BYTE0" | "DDR_BYTE1" | "DDR_ADDR_CTRL"

export interface DdrConnection {
  socSignal: string
  memorySignal: string
  traceName: string
  busName: DdrBusName
}

/** Connection catalogue cloned from 0hmX/am62l-lpddr4-breakout-repro. */
export const DDR_CONNECTIONS: readonly DdrConnection[] = [
  ...Array.from({ length: 8 }, (_, bit) => ({
    socSignal: `DDR0_DQ${bit}`,
    memorySignal: `DQ${bit}`,
    traceName: `DQ${bit}`,
    busName: "DDR_BYTE0" as const,
  })),
  ...Array.from({ length: 8 }, (_, offset) => {
    const bit = offset + 8
    return {
      socSignal: `DDR0_DQ${bit}`,
      memorySignal: `DQ${bit}`,
      traceName: `DQ${bit}`,
      busName: "DDR_BYTE1" as const,
    }
  }),
  {
    socSignal: "DDR0_DM0",
    memorySignal: "DMI0",
    traceName: "DM0",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DM1",
    memorySignal: "DMI1",
    traceName: "DM1",
    busName: "DDR_BYTE1",
  },
  {
    socSignal: "DDR0_DQS0",
    memorySignal: "DQS0_t",
    traceName: "DQS0",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DQS0_n",
    memorySignal: "DQS0_c",
    traceName: "DQS0_n",
    busName: "DDR_BYTE0",
  },
  {
    socSignal: "DDR0_DQS1",
    memorySignal: "DQS1_t",
    traceName: "DQS1",
    busName: "DDR_BYTE1",
  },
  {
    socSignal: "DDR0_DQS1_n",
    memorySignal: "DQS1_c",
    traceName: "DQS1_n",
    busName: "DDR_BYTE1",
  },
  ...Array.from({ length: 6 }, (_, bit) => ({
    socSignal: `DDR0_A${bit}`,
    memorySignal: `CA${bit}`,
    traceName: `A${bit}`,
    busName: "DDR_ADDR_CTRL" as const,
  })),
  {
    socSignal: "DDR0_CS0_n",
    memorySignal: "CS",
    traceName: "CS0_n",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CKE0",
    memorySignal: "CKE",
    traceName: "CKE0",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CK0",
    memorySignal: "CK_t",
    traceName: "CK0",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_CK0_n",
    memorySignal: "CK_c",
    traceName: "CK0_n",
    busName: "DDR_ADDR_CTRL",
  },
  {
    socSignal: "DDR0_RESET0_n",
    memorySignal: "RESET_n",
    traceName: "DDR_LINK_RESET0_n",
    busName: "DDR_ADDR_CTRL",
  },
]

const DDR_SOC_PHYSICAL_PINS = [
  76, 91, 92, 93, 94, 103, 104, 105, 121, 122, 123, 124, 125, 139, 140, 149,
  150, 162, 164, 165, 215, 216, 236, 238, 255, 256, 257, 272, 273, 275, 276,
  284, 285,
] as const

const usedSocPins = new Set<number>(DDR_SOC_PHYSICAL_PINS)
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((pin) => !usedSocPins.has(pin))
  .map((pin) => `pin${pin}`)

const usedMemorySignals = new Set(
  DDR_CONNECTIONS.map(({ memorySignal }) => memorySignal),
)
const memoryNoConnect = ballMap
  .map(({ signal }, index) => ({ signal, selector: `pin${index + 1}` }))
  .filter(({ signal }) => !usedMemorySignals.has(signal))
  .map(({ selector }) => selector)

const SIGNAL_LAYERS = [
  "top",
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

export const DDR_BYTE0_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE0",
).map(({ traceName }) => traceName)
export const DDR_BYTE1_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_BYTE1",
).map(({ traceName }) => traceName)
export const DDR_ADDR_CTRL_TRACE_NAMES = DDR_CONNECTIONS.filter(
  ({ busName }) => busName === "DDR_ADDR_CTRL",
).map(({ traceName }) => traceName)

export const Am62lLpddr4BreakoutRepro = ({
  routingDisabled = false,
}: {
  routingDisabled?: boolean
}) => (
  <board
    name="AM62L_LPDDR4_BREAKOUT_REPRO"
    width="45mm"
    height="25mm"
    layers={8}
    defaultTraceWidth="0.08128mm"
    minTraceWidth="0.08128mm"
    minTraceToPadEdgeClearance="0.05mm"
    minViaEdgeToPadEdgeClearance="0.08128mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
    minViaHoleDiameter="0.2032mm"
    minViaPadDiameter="0.4572mm"
    pcbStyle={{ viaHoleDiameter: "0.2032mm", viaPadDiameter: "0.4572mm" }}
    autorouterEffortLevel="10x"
    routingDisabled={routingDisabled}
  >
    <breakout
      name="SOC_BREAKOUT"
      pcbX={-10}
      pcbY={0}
      fanoutBoundaryPadding={{
        top: "5mm",
        right: "2mm",
        bottom: "5mm",
        left: "1mm",
      }}
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      busFanoutDirections={{
        DDR_BYTE1: "top_right",
        DDR_ADDR_CTRL: "center_right",
        DDR_BYTE0: "bottom_right",
      }}
    >
      <AM62L32
        name="U1"
        footprintVariant="fccsp_373_anb"
        pcbX={0}
        pcbY={0}
        pcbRotation={180}
        noSchematicRepresentation
        noConnect={socNoConnect as any}
      />
    </breakout>

    <breakout
      name="RAM_BREAKOUT"
      pcbX={10.116917}
      pcbY={-0.050917}
      fanoutBoundaryPadding={{
        top: "5mm",
        right: "1mm",
        bottom: "5mm",
        left: "2mm",
      }}
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      busFanoutDirections={{
        DDR_BYTE1: "top_left",
        DDR_ADDR_CTRL: "center_left",
        DDR_BYTE0: "bottom_left",
      }}
    >
      <MT53E1G16D1ZW
        name="U2"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        noSchematicRepresentation
        noConnect={memoryNoConnect as any}
      />
    </breakout>

    <bus
      name="DDR_BYTE0"
      connections={DDR_BYTE0_TRACE_NAMES}
      preferredLayers={["inner1", "inner4"]}
    />
    <bus
      name="DDR_BYTE1"
      connections={DDR_BYTE1_TRACE_NAMES}
      preferredLayers={["inner2", "inner5"]}
    />
    <bus
      name="DDR_ADDR_CTRL"
      connections={DDR_ADDR_CTRL_TRACE_NAMES}
      preferredLayers={["inner3", "inner6"]}
    />

    <differentialpair
      name="DQS0_PAIR"
      positiveConnection="DQS0"
      negativeConnection="DQS0_n"
    />
    <differentialpair
      name="DQS1_PAIR"
      positiveConnection="DQS1"
      negativeConnection="DQS1_n"
    />
    <differentialpair
      name="CK0_PAIR"
      positiveConnection="CK0"
      negativeConnection="CK0_n"
    />

    {DDR_CONNECTIONS.map(({ socSignal, memorySignal, traceName }) => (
      <Fragment key={traceName}>
        <trace
          name={traceName}
          from={`U1.${socSignal}`}
          to={`U2.${memorySignal}`}
        />
      </Fragment>
    ))}
  </board>
)
