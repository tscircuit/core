// PCB coordinates are board-world points in mm: +X right and +Y up.
export const SignalTerminal = ({
  name,
  pcbX,
  pcbY,
}: {
  name: string
  pcbX: number
  pcbY: number
}) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    pinLabels={{ pin1: ["SIGNAL"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          shape="circle"
          radius={0.3}
          pcbX={0}
          pcbY={0}
        />
      </footprint>
    }
  />
)

export const MatchedBusPhaseSplitFixture = ({
  constrainLength = true,
  routeTogether = false,
}: {
  constrainLength?: boolean
  routeTogether?: boolean
} = {}) => (
  <board
    width={30}
    height={18}
    schematicDisabled
    routeRemaining={false}
    layers={2}
  >
    <SignalTerminal name="TX0" pcbX={-10} pcbY={3} />
    <SignalTerminal name="RX0" pcbX={10} pcbY={3} />
    <SignalTerminal name="TX1" pcbX={-10} pcbY={-3} />
    <SignalTerminal name="RX1" pcbX={6} pcbY={-3} />
    <trace name="DATA0" from="TX0.pin1" to="RX0.pin1" routingPhaseIndex={0} />
    <trace name="DATA1" from="TX1.pin1" to="RX1.pin1" routingPhaseIndex={1} />
    <bus
      name="DATA"
      connections={["DATA0", "DATA1"]}
      maxLengthSkew={constrainLength ? 0.1 : undefined}
      pcbTraceWidth={0.15}
      routingPhaseIndex={routeTogether ? 0 : undefined}
    />
    <autoroutingphase name="FIRST_DATA" phaseIndex={0} autorouter="bus_lanes" />
    <autoroutingphase
      name="SECOND_DATA"
      phaseIndex={1}
      autorouter="bus_lanes"
    />
    <pcbnotetext
      pcbX={0}
      pcbY={4.1}
      fontSize={0.35}
      text="DATA0: TX0 to RX0, 20mm endpoint separation"
    />
    <pcbnotetext
      pcbX={0}
      pcbY={-1.9}
      fontSize={0.35}
      text="DATA1: TX1 to RX1, 16mm endpoint separation"
    />
    <pcbnotetext
      pcbX={0}
      pcbY={-7.4}
      fontSize={0.35}
      text={
        constrainLength
          ? routeTogether
            ? "DATA: 0.10mm maximum skew; complete bus in FIRST_DATA."
            : "DATA: 0.10mm maximum skew; members assigned to different phases."
          : "DATA: unconstrained bus; independent phases remain supported."
      }
    />
  </board>
)
