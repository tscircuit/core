import ballMap from "./ball-map.json"

// AM3352 ZCZ top-view ball map: TI SPRS717L, pages 15–17.
// Same 18 x 18, 0.8 mm-pitch footprint used by the AM3352 routing experiment.
// Right-handed board-world points in mm (+X right, +Y up, +Z above).
// U1 is at the origin, unrotated; these are points, not direction vectors.
const rows = "ABCDEFGHJKLMNPRTUV"
export const balls = Object.entries(ballMap).map(([ball, signal]) => ({
  ball,
  signal,
  x: (rows.indexOf(ball[0]!) - 8.5) * 0.8,
  y: (Number(ball.slice(1)) - 9.5) * 0.8,
  kind: signal.startsWith("VSS")
    ? "ground"
    : /^(VDD|CAP_VDD)/.test(signal)
      ? "power"
      : "signal",
}))

export function AM3352() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="AM3352BZCZ100"
      noSchematicRepresentation
      connections={Object.fromEntries(
        balls.map(({ signal }, index) => [`pin${index + 1}`, `net.${signal}`]),
      )}
      pinLabels={Object.fromEntries(
        balls.map(({ ball }, index) => [`pin${index + 1}`, ball]),
      )}
      footprint={
        <footprint>
          {balls.map(({ ball, x, y }, index) => (
            <smtpad
              portHints={[ball, `pin${index + 1}`]}
              pcbX={x}
              pcbY={y}
              shape="circle"
              radius={0.2}
            />
          ))}
          {balls
            .filter((ball) => ball.kind !== "signal")
            .map(({ x, y, kind }) => (
              <pcbnotetext
                pcbX={x}
                pcbY={y}
                fontSize={0.21}
                text={kind === "ground" ? "G" : "P"}
              />
            ))}
          <silkscreenrect width={15.4} height={15.4} />
          <silkscreencircle pcbX={-7.8} pcbY={-7.8} radius={0.3} />
        </footprint>
      }
    />
  )
}
