import { Fragment, type ReactElement } from "react"
import { SourcePart } from "./source-part"
import source from "./source-data.json"

const clockNetNames = new Set(["RAM_CK+", "RAM_CK-", "Net-(C27-Pad1)"])

/** Native board-world placements in mm, +X right/+Y up. The board origin is
 * the native outline center. All selected copper pads and DDR nets remain;
 * only the explicitly requested clock phases are autorouted.
 */
export function OrangeCrabDdrClockBoard({
  routeTerminations = false,
}: {
  routeTerminations?: boolean
}): ReactElement {
  return (
    <board
      title="OrangeCrab r0.2.1 DDR clock reproduction"
      width={source.width}
      height={source.height}
      layers={6}
      schematicDisabled
      routeRemaining={false}
      minTraceWidth={0.0889}
      minTraceToPadEdgeClearance={0.089}
      minViaPadDiameter={0.28}
      minViaHoleDiameter={0.15}
    >
      {source.parts.map((part) => (
        <SourcePart key={part.name} part={part} />
      ))}
      <autoroutingphase
        name="CLOCK_TRUNKS"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
      {routeTerminations && (
        <autoroutingphase
          name="TERMINATION_TAPS"
          phaseIndex={1}
          autorouter="auto_local"
        />
      )}
      <trace
        name="CK_P_TRUNK"
        from=".U3 > .BALL_J18"
        to=".U4 > .BALL_J7"
        thickness={0.0889}
        routingPhaseIndex={0}
      />
      <trace
        name="CK_N_TRUNK"
        from=".U3 > .BALL_K18"
        to=".U4 > .BALL_K7"
        thickness={0.0889}
        routingPhaseIndex={0}
      />
      <trace
        name="CK_P_TAP"
        from=".U4 > .BALL_J7"
        to=".R5 > .pin2"
        thickness={0.0889}
        routingPhaseIndex={routeTerminations ? 1 : undefined}
      />
      <trace
        name="CK_N_TAP"
        from=".U4 > .BALL_K7"
        to=".R13 > .pin2"
        thickness={0.0889}
        routingPhaseIndex={routeTerminations ? 1 : undefined}
      />
      <trace
        name="CK_CENTER"
        from=".R5 > .pin1"
        to=".R13 > .pin1"
        thickness={0.0889}
        routingPhaseIndex={routeTerminations ? 1 : undefined}
      />
      <trace
        name="CK_CENTER_CAP"
        from=".R5 > .pin1"
        to=".C27 > .pin1"
        thickness={0.0889}
        routingPhaseIndex={routeTerminations ? 1 : undefined}
      />
      {source.connections
        .filter((connection) => !clockNetNames.has(connection.sourceNet))
        .map((connection) => (
          <Fragment key={connection.name}>
            <trace
              name={connection.name}
              path={connection.points.map(
                (point) => `.${point.ref} > .${point.pin}`,
              )}
              thickness={connection.traceWidth}
            />
          </Fragment>
        ))}
      <bus
        name="DDR_CLOCK"
        connections={["CK_P_TRUNK", "CK_N_TRUNK"]}
        routingPhaseIndex={0}
        pcbAllowedLayers={["inner3"]}
        maxLengthSkew={0.1}
      />
      <differentialpair
        name="CK_PAIR"
        positiveConnection="CK_P_TRUNK"
        negativeConnection="CK_N_TRUNK"
        maxLengthSkew={0.1}
        pcbTraceGap={0.089}
      />
      <pcbnotetext
        pcbX={1.3}
        pcbY={9.5}
        fontSize={0.5}
        text="U3: ECP5 csBGA285"
      />
      <pcbnotetext
        pcbX={14.9}
        pcbY={7.5}
        fontSize={0.5}
        text="U4: DDR3 BGA96"
      />
      <pcbnotetext
        pcbX={16}
        pcbY={9.5}
        fontSize={0.35}
        text="R5/R13: 51 ohms; C27: 100nF"
      />
      <pcbnotetext
        pcbX={7}
        pcbY={-6.1}
        fontSize={0.35}
        text="CK pair: U3.J18/K18 to U4.J7/K7; skew target 0.1mm"
      />
      <pcbnotetext
        pcbX={7}
        pcbY={-6.8}
        fontSize={0.4}
        text="OrangeCrab r0.2.1: original placements and 387 pads"
      />
      <pcbnotetext
        pcbX={7}
        pcbY={-7.5}
        fontSize={0.35}
        text={
          routeTerminations
            ? "Clock + termination phases requested; other DDR traces pending"
            : "Clock trunks only (inner3); termination and other DDR traces pending"
        }
      />
    </board>
  )
}
