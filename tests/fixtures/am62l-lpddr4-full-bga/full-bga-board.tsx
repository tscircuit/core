import { AM62L32 } from "@tsci/tscircuit.ti-am62l/lib/chips/AM62L32.circuit"
import { AM62L32BOGHAANBR } from "@tsci/tscircuit.ti-am62l/lib/chips/AM62L32BOGHAANBR.circuit"
import { Children, cloneElement, Fragment, isValidElement } from "react"
import type { GenericLocalAutorouter } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import {
  DDR_ADDR_CTRL_TRACE_NAMES,
  DDR_BYTE0_TRACE_NAMES,
  DDR_BYTE1_TRACE_NAMES,
  DDR_CONNECTIONS,
  DDR_SOC_PHYSICAL_PINS,
} from "./ddr-connections"
import { MT53E1G16D1ZW, ballMap } from "./mt53e1g16d1zw"
import {
  createCapacityChannelAutorouter,
  createExistingCopperConnectivityAutorouter,
  createFixedTargetBgaFanoutAutorouter,
} from "./local-autorouters"

const AM62L_PAD_DIAMETER_MM = 0.254
const AM62L_PAD_RADIUS_MM = AM62L_PAD_DIAMETER_MM / 2
const AM62L_DEFAULT_CHIP = AM62L32BOGHAANBR({} as any)

export const SOC_GROUND_PINS = Object.entries(
  AM62L_DEFAULT_CHIP.props.pinLabels,
)
  .filter(([, labels]) =>
    (Array.isArray(labels) ? labels : [labels]).some((label) =>
      String(label).startsWith("VSS"),
    ),
  )
  .map(([selector]) => Number(selector.replace("pin", "")))

export const MEMORY_GROUND_PINS = ballMap
  .map(({ ball, signal }, index) => ({
    ball,
    signal,
    pin: index + 1,
  }))
  .filter(({ signal }) => signal === "VSS")

const createAm62lEscapeFootprint = () => {
  const defaultFootprint = AM62L_DEFAULT_CHIP.props.footprint
  return cloneElement(
    defaultFootprint,
    {},
    Children.map(defaultFootprint.props.children, (child) =>
      isValidElement(child) && child.type === "smtpad"
        ? cloneElement(child, { radius: `${AM62L_PAD_RADIUS_MM}mm` } as any)
        : child,
    ),
  )
}

const AM62L_ESCAPE_FOOTPRINT = createAm62lEscapeFootprint()

const usedSocPins = new Set<number>([
  ...DDR_SOC_PHYSICAL_PINS,
  ...SOC_GROUND_PINS,
])
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((pin) => !usedSocPins.has(pin))
  .map((pin) => `pin${pin}`)

const usedMemorySignals = new Set([
  ...DDR_CONNECTIONS.map(({ memorySignal }) => memorySignal),
  "VSS",
])
const memoryNoConnect = ballMap
  .map(({ signal }, index) => ({ signal, selector: `pin${index + 1}` }))
  .filter(({ signal }) => !usedMemorySignals.has(signal))
  .map(({ selector }) => selector)

const GLOBAL_ROUTING_PHASE = 1
const PLANE_CONNECTED_NET_PHASE = 2
export const SIGNAL_LAYERS = [
  "inner1",
  "inner2",
  "inner3",
  "inner4",
  "inner5",
  "inner6",
  "bottom",
] as const

const fixedTargetBgaBreakoutAutorouter = {
  local: true,
  groupMode: "subcircuit" as const,
  algorithmFn: createFixedTargetBgaFanoutAutorouter,
}

const capacityChannelAutorouter = {
  local: true,
  groupMode: "subcircuit" as const,
  algorithmFn: createCapacityChannelAutorouter,
}

const existingCopperConnectivityAutorouter = {
  local: true,
  groupMode: "subcircuit" as const,
  algorithmFn: createExistingCopperConnectivityAutorouter,
}

export const SOC_POSITION = { x: -13, y: 0 } as const
export const RAM_POSITION = { x: 17.675, y: -0.050917 } as const
export const BOARD_SIZE = { width: 60, height: 30 } as const
export const GROUND_POUR_LAYERS = ["inner1", "inner6", "top", "bottom"] as const
const POUR_MARGIN = "0.08128mm"

export type Am62lLpddr4FanoutSolver = "normal" | "bga"

type LocalAutorouterAlgorithmFn = (
  input: SimpleRouteJson,
) => Promise<GenericLocalAutorouter>

export const Am62lLpddr4FullBgaBoard = ({
  fanoutSolver = "bga",
  fanoutAlgorithmFn,
  channelAlgorithmFn,
}: {
  fanoutSolver?: Am62lLpddr4FanoutSolver
  fanoutAlgorithmFn?: LocalAutorouterAlgorithmFn
  channelAlgorithmFn?: LocalAutorouterAlgorithmFn
}) => {
  const selectedFanoutAutorouter = fanoutAlgorithmFn
    ? { ...fixedTargetBgaBreakoutAutorouter, algorithmFn: fanoutAlgorithmFn }
    : fixedTargetBgaBreakoutAutorouter
  const selectedChannelAutorouter = channelAlgorithmFn
    ? { ...capacityChannelAutorouter, algorithmFn: channelAlgorithmFn }
    : capacityChannelAutorouter
  return (
  <board
    name="AM62L_LPDDR4_BGA_FANOUT_COPPER_POUR"
    width={`${BOARD_SIZE.width}mm`}
    height={`${BOARD_SIZE.height}mm`}
    layers={8}
    defaultTraceWidth="0.08128mm"
    minTraceWidth="0.08128mm"
    minTraceToPadEdgeClearance="0.08128mm"
    minViaEdgeToPadEdgeClearance="0.08128mm"
    minPadEdgeToPadEdgeClearance="0.08128mm"
    minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
    minBoardEdgeClearance={POUR_MARGIN}
    minViaHoleDiameter="0.2032mm"
    minViaPadDiameter="0.4572mm"
    pcbStyle={{ viaHoleDiameter: "0.2032mm", viaPadDiameter: "0.4572mm" }}
    autorouterEffortLevel="10x"
  >
    <net name="GND" routingPhaseIndex={PLANE_CONNECTED_NET_PHASE} />
    <autoroutingphase
      name="inter-bga-ddr"
      phaseIndex={GLOBAL_ROUTING_PHASE}
      autorouter={selectedChannelAutorouter}
    />
    <autoroutingphase
      name="existing-ground-copper"
      phaseIndex={PLANE_CONNECTED_NET_PHASE}
      autorouter={existingCopperConnectivityAutorouter}
    />
    <bus
      name="DDR_BYTE0"
      connections={DDR_BYTE0_TRACE_NAMES}
      routingPhaseIndex={GLOBAL_ROUTING_PHASE}
      pcbTraceWidth="0.08128mm"
      pcbAllowedLayers={[...SIGNAL_LAYERS]}
      preferredLayer="inner2"
    />
    <bus
      name="DDR_BYTE1"
      connections={DDR_BYTE1_TRACE_NAMES}
      routingPhaseIndex={GLOBAL_ROUTING_PHASE}
      pcbTraceWidth="0.08128mm"
      pcbAllowedLayers={[...SIGNAL_LAYERS]}
      preferredLayer="inner2"
    />
    <bus
      name="DDR_ADDR_CTRL"
      connections={DDR_ADDR_CTRL_TRACE_NAMES}
      routingPhaseIndex={GLOBAL_ROUTING_PHASE}
      pcbTraceWidth="0.08128mm"
      pcbAllowedLayers={[...SIGNAL_LAYERS]}
      preferredLayer="bottom"
    />

    <breakout
      name="SOC_BREAKOUT"
      pcbX={SOC_POSITION.x}
      pcbY={SOC_POSITION.y}
      padding="5mm"
      paddingRight="18.5mm"
      autorouter={
        fanoutSolver === "normal" ? "fanout" : selectedFanoutAutorouter
      }
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      fanoutPourNetMap={{ inner1: "GND" }}
      busFanoutDirections={{
        DDR_BYTE1: "rightside_top",
        DDR_ADDR_CTRL: "rightside_center",
        DDR_BYTE0: "rightside_bottom",
      }}
    >
      <AM62L32
        name="U1"
        footprintVariant="fccsp_373_anb"
        footprint={AM62L_ESCAPE_FOOTPRINT}
        pcbX={0}
        pcbY={0}
        pcbRotation={180}
        noSchematicRepresentation
        noConnect={socNoConnect as any}
        internallyConnectedPins={
          [SOC_GROUND_PINS.map((pin) => `pin${pin}`)] as any
        }
      />
    </breakout>

    <breakout
      name="RAM_BREAKOUT"
      pcbX={RAM_POSITION.x}
      pcbY={RAM_POSITION.y}
      padding="5mm"
      paddingLeft="6.2mm"
      autorouter={
        fanoutSolver === "normal" ? "fanout" : selectedFanoutAutorouter
      }
      fanoutRoutingLayers={[...SIGNAL_LAYERS]}
      fanoutPourNetMap={{ inner1: "GND" }}
      busFanoutDirections={{
        DDR_BYTE1: "leftside_top",
        DDR_ADDR_CTRL: "leftside_center",
        DDR_BYTE0: "leftside_bottom",
      }}
    >
      <MT53E1G16D1ZW
        name="U2"
        pcbX={0}
        pcbY={0}
        pcbRotation={90}
        noSchematicRepresentation
        noConnect={memoryNoConnect as any}
        internallyConnectedPins={
          [MEMORY_GROUND_PINS.map(({ pin }) => `pin${pin}`)] as any
        }
      />
    </breakout>

    {DDR_CONNECTIONS.map(({ socSignal, memorySignal, traceName }) => (
      <Fragment key={traceName}>
        <trace
          name={traceName}
          from={`U1.${socSignal}`}
          to={`U2.${memorySignal}`}
        />
      </Fragment>
    ))}

    <trace
      name="U1_VSS_GND"
      from={`U1.pin${SOC_GROUND_PINS[0]}`}
      to="net.GND"
    />
    <trace
      name="U2_VSS_GND"
      from={`U2.pin${MEMORY_GROUND_PINS[0]!.pin}`}
      to="net.GND"
    />

    <copperpour
      name="GND_PLANE_INNER1"
      connectsTo="net.GND"
      layer="inner1"
      unbroken
      clearance={POUR_MARGIN}
      boardEdgeMargin={POUR_MARGIN}
    />
    <copperpour
      name="GND_PLANE_INNER6"
      connectsTo="net.GND"
      layer="inner6"
      unbroken
      clearance={POUR_MARGIN}
      boardEdgeMargin={POUR_MARGIN}
    />
    <copperpour
      name="GND_POUR_TOP"
      connectsTo="net.GND"
      layer="top"
      clearance={POUR_MARGIN}
      padMargin={POUR_MARGIN}
      traceMargin={POUR_MARGIN}
      boardEdgeMargin={POUR_MARGIN}
    />
    <copperpour
      name="GND_POUR_BOTTOM"
      connectsTo="net.GND"
      layer="bottom"
      clearance={POUR_MARGIN}
      padMargin={POUR_MARGIN}
      traceMargin={POUR_MARGIN}
      boardEdgeMargin={POUR_MARGIN}
    />
  </board>
  )
}

export default Am62lLpddr4FullBgaBoard
