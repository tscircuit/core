import type { ReactElement } from "react"

const Terminal = ({ name, x, y, layer = "top" }: { name: string; x: number; y: number; layer?: "top" | "bottom" }): ReactElement => (
  <chip name={name} pcbX={x} pcbY={y} layer={layer} pinLabels={{ pin1: "SIGNAL" }} footprint={
    <footprint><smtpad shape="rect" width={1} height={1} pcbX={0} pcbY={0} portHints={["pin1"]} /></footprint>
  } />
)

/** Circuit-world mm, +X right, +Y up. pcbPath offsets are relative to A.pin1.
 * A manufactured two-layer path exists before the separate upper net routes.
 */
export const ManualFixedBoard = (): ReactElement => (
  <board width={14} height={10} layers={2} schematicDisabled routeRemaining={false}
    minTraceWidth={0.2} minTraceToPadEdgeClearance={0.1}
    minViaPadDiameter={0.6} minViaHoleDiameter={0.3} isViaInPadAllowed={false}>
    <Terminal name="A" x={-4} y={-2} />
    <Terminal name="B" x={4} y={-2} layer="bottom" />
    <Terminal name="C" x={-4} y={2} />
    <Terminal name="D" x={4} y={2} />
    <trace name="EXISTING" from=".A > .pin1" to=".B > .pin1" thickness={0.2}
      pcbPathRelativeTo=".A > .pin1" pcbPath={[
        { x: 0, y: 0 }, { x: 2, y: 0 },
        { x: 2, y: 1.5, via: true, fromLayer: "top", toLayer: "bottom" },
        { x: 6, y: 1.5 }, { x: 6, y: 0 }, { x: 8, y: 0 },
      ]} />
    <trace name="NEW" from=".C > .pin1" to=".D > .pin1" thickness={0.2} />
    <autoroutingphase name="finish" autorouter="auto_local" connections={["NEW"]} />
  </board>
)
