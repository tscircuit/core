import type { AutorouterDefinition, ChipProps } from "@tscircuit/props"
import type { PcbTrace } from "circuit-json"
import type { FanoutTracePath } from "lib/index"
import { BusLanesAutorouter } from "lib/utils/autorouting/BusLanesAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { Fragment } from "react"
import { createAutoroutingPhaseIoStack } from "./create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "./createBasicAutorouter"
import { getTestFixture } from "./get-test-fixture"

type SourceOwnedSimplifiedPcbTrace = SimplifiedPcbTrace &
  Pick<PcbTrace, "source_trace_id">

/** Terminal positions are board-world points in mm: +X right, +Y up, +Z above. */
function Terminal({
  name,
  pcbX,
  pcbY,
  layer,
}: Pick<ChipProps, "name" | "pcbX" | "pcbY" | "layer">) {
  return (
    <chip
      name={name}
      pcbX={pcbX}
      pcbY={pcbY}
      layer={layer}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX={0}
            pcbY={0}
            shape="circle"
            radius={0.2}
          />
        </footprint>
      }
    />
  )
}

/**
 * Real dogbone and bus-lanes geometry in right-handed board-world mm: +X right,
 * +Y up, +Z above. Route, pad, and note positions are points, not directions.
 */
export function getDogbonePhaseHandoffFixture({
  includeSavedCopper = false,
}: { includeSavedCopper?: boolean } = {}) {
  const earlierRoute = [
    { route_type: "wire", x: 2, y: -2, layer: "bottom", width: 0.102 },
    { route_type: "wire", x: 2, y: 2, layer: "bottom", width: 0.102 },
  ] satisfies FanoutTracePath["route"]
  const savedRoute = [
    { route_type: "wire", x: -6, y: 3, layer: "bottom", width: 0.102 },
    { route_type: "wire", x: -4, y: 3, layer: "bottom", width: 0.102 },
  ] satisfies FanoutTracePath["route"]
  const earlierPhaseIndex = includeSavedCopper ? 1 : 0
  const createEarlierCopper = createBasicAutorouter(async (input) => {
    const connection = input.connections[0]!
    return [
      {
        type: "pcb_trace",
        pcb_trace_id: "earlier_phase_copper",
        connection_name: connection.name,
        source_trace_id: connection.source_trace_id,
        route: earlierRoute,
      } satisfies SourceOwnedSimplifiedPcbTrace,
    ]
  })
  const createNativeFollowUpRouter = (input: SimpleRouteJson) =>
    new BusLanesAutorouter(input)
  const { circuit } = getTestFixture({
    platform: {
      autorouterMap: {
        default: {
          // Core platform presets consume the native event-based adapter;
          // props declares the separate async run/output contract.
          createAutorouter:
            createNativeFollowUpRouter as unknown as AutorouterDefinition["createAutorouter"],
        },
      },
    },
  })
  circuit.schematicDisabled = true
  const phaseIo = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board
      width={20}
      height={16}
      layers={4}
      routeRemaining={false}
      minTraceWidth={0.102}
      defaultTraceWidth={0.102}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
    >
      {includeSavedCopper && (
        <>
          <autoroutingphase
            name="SAVED_COPPER"
            phaseIndex={0}
            pcbTracePaths={[{ connection: "S1.pin1", route: savedRoute }]}
          />
          <Terminal name="S1" pcbX={-6} pcbY={3} layer="bottom" />
          <Terminal name="S2" pcbX={-4} pcbY={3} layer="bottom" />
          <trace
            name="SAVED"
            from="S1.pin1"
            to="S2.pin1"
            routingPhaseIndex={0}
          />
          <pcbnotetext
            pcbY={5.5}
            fontSize={0.35}
            text="Saved S1-S2 stays fixed on bottom"
            layer="bottom"
          />
          <pcbnotetext
            pcbX={-6}
            pcbY={3.6}
            text="S1"
            fontSize={0.35}
            layer="bottom"
          />
          <pcbnotetext
            pcbX={-4}
            pcbY={3.6}
            text="S2"
            fontSize={0.35}
            layer="bottom"
          />
        </>
      )}
      <autoroutingphase
        name="EARLIER_COPPER"
        phaseIndex={earlierPhaseIndex}
        algorithmFn={createEarlierCopper}
      />
      <Terminal name="M1" pcbX={2} pcbY={-2} layer="bottom" />
      <Terminal name="M2" pcbX={2} pcbY={2} layer="bottom" />
      <trace
        name="EARLIER"
        from="M1.pin1"
        to="M2.pin1"
        routingPhaseIndex={earlierPhaseIndex}
      />
      <autoroutingphase
        name="SIGNAL_DOGBONE"
        phaseIndex={earlierPhaseIndex + 1}
        autorouter="dogbone"
        fanoutRoutingLayers={["bottom"]}
      />
      <chip
        name="U1"
        footprint={
          <footprint>
            {Array.from({ length: 16 }, (_, padIndex) => (
              <Fragment key={padIndex}>
                <smtpad
                  portHints={[`pin${padIndex + 1}`]}
                  pcbX={(padIndex % 4) * 0.8 - 1.2}
                  pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
                  shape="circle"
                  radius={0.2}
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
      <Terminal name="DEST" pcbX={6} pcbY={0} layer="bottom" />
      <trace
        name="SIGNAL"
        from="U1.pin6"
        to="DEST.pin1"
        routingPhaseIndex={earlierPhaseIndex + 1}
      />
      <bus
        name="SIGNAL_BUS"
        connections={["SIGNAL"]}
        pcbAllowedLayers={["bottom"]}
        pcbTraceWidth={0.102}
      />
      <pcbnotetext
        pcbY={7}
        fontSize={0.4}
        text="Earlier copper → Dogbone → bus-lanes"
        layer="bottom"
      />
      <pcbnotetext
        pcbY={6.2}
        fontSize={0.4}
        text="SIGNAL must avoid M1-M2 on bottom"
        layer="bottom"
      />
      <pcbnotetext
        pcbX={2}
        pcbY={-2.6}
        text="M1"
        fontSize={0.35}
        layer="bottom"
      />
      <pcbnotetext
        pcbX={2}
        pcbY={2.6}
        text="M2"
        fontSize={0.35}
        layer="bottom"
      />
      <pcbnotetext
        pcbX={6}
        pcbY={0.6}
        text="DEST"
        fontSize={0.35}
        layer="bottom"
      />
      <pcbnotetext
        pcbX={-0.6}
        pcbY={-1.5}
        text="U1 exit"
        fontSize={0.35}
        layer="bottom"
      />
    </board>,
  )
  return { circuit, phaseIo, earlierRoute, savedRoute, earlierPhaseIndex }
}
