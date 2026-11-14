import type { AutorouterConfig } from "@tscircuit/props"

/** Board-world points in mm, +X right, +Y up. Native top-layer terminals
 * connect through two plated vias per signal onto the inner1 carrier.
 */
export function BusLanesConnectivityBoard({
  autorouter,
  scope = "phase",
}: {
  autorouter: AutorouterConfig
  scope?: "board" | "phase"
}) {
  return (
    <board
      width={10}
      height={7}
      layers={4}
      schematicDisabled
      autorouter={scope === "board" ? autorouter : undefined}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
      minViaHoleEdgeToViaHoleEdgeClearance={0.25}
      routeRemaining={scope === "phase" ? false : undefined}
    >
      {scope === "phase" && <autoroutingphase autorouter={autorouter} />}
      {(["U1", "U2"] as const).map((name, side) => (
        <chip
          key={name}
          name={name}
          pinLabels={{ pin1: "DATA0", pin2: "DATA1" }}
          pcbX={side ? 2.5 : -2.5}
          pcbY={0.5}
          footprint={
            <footprint>
              {[0, 1].map((pin) => (
                <smtpad
                  shape="circle"
                  radius={0.15}
                  pcbX={(side ? 1 : -1) * (pin ? -0.5 : 0.5)}
                  pcbY={pin ? 0.5 : -0.5}
                  portHints={[`pin${pin + 1}`]}
                />
              ))}
            </footprint>
          }
        />
      ))}
      <trace name="DATA0" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="DATA1" from=".U1 > .pin2" to=".U2 > .pin2" />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        pcbAllowedLayers={["inner1"]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-1.5}
        fontSize={0.25}
        text="2 fresh signals; inner1 carrier; 4 through vias"
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2}
        fontSize={0.25}
        text="Connectivity and copper DRC; timing not requested"
      />
    </board>
  )
}
