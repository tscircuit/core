import type { RootCircuit } from "lib/RootCircuit"
import { LengthTestTerminal } from "./length-test-terminal"

export const addFixedMatchedBus = (
  circuit: RootCircuit,
  {
    fixed = true,
    matched = true,
    targetLength,
    lengthTolerance,
    extraFixedLength,
    extraPending = false,
    explanation = "Fixed DATA0 = 28 mm; pending DATA1 spans 20 mm",
  }: {
    fixed?: boolean
    matched?: boolean
    targetLength?: number
    lengthTolerance?: number
    extraPending?: boolean
    extraFixedLength?: number
    explanation?: string
  } = {},
) => {
  circuit.add(
    <board
      width={34}
      height={30}
      schematicDisabled
      routeRemaining={false}
      layers={2}
    >
      <pcbnotetext
        pcbY={12.5}
        fontSize={0.55}
        text={
          fixed
            ? "Pre-routed + pending bus members"
            : "All-pending matched bus control"
        }
      />
      <pcbnotetext pcbY={11} fontSize={0.42} text={explanation} />
      <pcbnotetext
        pcbY={9.7}
        fontSize={0.42}
        text={
          matched
            ? "DATA complete-group maximum skew: 0.1 mm"
            : "DATA has no skew constraint"
        }
      />
      <LengthTestTerminal name="TX0" x={-10} y={3} />
      <LengthTestTerminal name="RX0" x={10} y={3} />
      <LengthTestTerminal name="TX1" x={-10} y={-5} />
      <LengthTestTerminal name="RX1" x={10} y={-5} />
      <trace
        name="DATA0"
        from=".TX0 > .pin1"
        to=".RX0 > .pin1"
        routingPhaseIndex={0}
        {...(fixed
          ? {
              pcbPathRelativeTo: ".TX0 > .pin1",
              pcbPath: [
                { x: 0, y: 0 },
                { x: 0, y: 4 },
                { x: 20, y: 4 },
                { x: 20, y: 0 },
              ],
            }
          : {})}
      />
      <trace
        name="DATA1"
        from=".TX1 > .pin1"
        to=".RX1 > .pin1"
        routingPhaseIndex={0}
      />
      {(extraFixedLength !== undefined || extraPending) && (
        <>
          <LengthTestTerminal name="TX2" x={-10} y={-11} />
          <LengthTestTerminal name="RX2" x={10} y={-11} />
          <trace
            name="DATA2"
            from=".TX2 > .pin1"
            to=".RX2 > .pin1"
            routingPhaseIndex={0}
            {...(extraFixedLength !== undefined
              ? {
                  pcbPathRelativeTo: ".TX2 > .pin1",
                  pcbPath: [
                    { x: 0, y: 0 },
                    { x: 0, y: (extraFixedLength - 20) / 2 },
                    { x: 20, y: (extraFixedLength - 20) / 2 },
                    { x: 20, y: 0 },
                  ],
                }
              : {})}
          />
        </>
      )}
      <bus
        name="DATA"
        connections={
          extraFixedLength === undefined && !extraPending
            ? ["DATA0", "DATA1"]
            : ["DATA0", "DATA1", "DATA2"]
        }
        maxLengthSkew={matched ? 0.1 : undefined}
        pcbTraceWidth={0.15}
        targetLength={targetLength}
        lengthTolerance={lengthTolerance}
      />
      <autoroutingphase
        name="COMPLETE_DATA"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
    </board>,
  )
}
