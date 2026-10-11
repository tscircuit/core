import type { ManualPcbPathPoint } from "lib/utils/pcbTraceRouteToPcbPath"
import { Fragment } from "react"

/** Board-world XY in mm, +X right/+Y up; pcbPath coordinates are anchor-local. */
export function ManualThroughViaBoard({
  allowBlindAndBuriedVias = false,
  multiplePaths = false,
} = {}) {
  const path: ManualPcbPathPoint[] = [
    { x: 2, y: 0 },
    { x: 2, y: 0, via: true, fromLayer: "top", toLayer: "inner1" },
    { x: 4, y: 0 },
    { x: 4, y: 0, via: true, fromLayer: "inner1", toLayer: "inner2" },
    { x: 6, y: 0 },
    { x: 6, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
  ]
  return (
    <board
      width={16}
      height={10}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias={allowBlindAndBuriedVias}
      pcbStyle={{ viaPadDiameter: 0.8, viaHoleDiameter: 0.4 }}
      schematicDisabled
    >
      {[-4, 4].map((x, index) => (
        <chip
          key={x}
          name={`J${index + 1}`}
          pcbX={x}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad portHints={["1"]} shape="circle" radius={0.4} />
            </footprint>
          }
        />
      ))}
      <trace
        from="J1.pin1"
        to="J2.pin1"
        {...(multiplePaths
          ? { pcbPaths: [["J1.pin1", ...path, "J2.pin1"]] }
          : { pcbPath: path })}
      />
      <net name="GND" />
      <via
        name="GND_STITCH"
        pcbX={0}
        pcbY={-3}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter={0.8}
        holeDiameter={0.4}
        connectsTo="net.GND"
      />
      <copperpour
        name="BOTTOM_GND"
        layer="bottom"
        connectsTo="net.GND"
        clearance={0.2}
      />
      <pcbnotetext
        text={
          multiplePaths
            ? "Declared pcbPaths: three vias"
            : "Declared pcbPath: three vias"
        }
        pcbY={3.8}
        fontSize={0.5}
        layer="bottom"
      />
      <pcbnotetext
        text={
          allowBlindAndBuriedVias
            ? "Blind/buried enabled: no SIGNAL land on BOTTOM"
            : "Through-hole board: all three SIGNAL lands reach BOTTOM"
        }
        pcbY={2.8}
        fontSize={0.4}
        layer="bottom"
      />
      {[-2, 0, 2].map((x, index) => (
        <Fragment key={x}>
          <pcbnotetext
            text={`V${index + 1}`}
            pcbX={x}
            pcbY={0.9}
            fontSize={0.4}
            layer="bottom"
          />
        </Fragment>
      ))}
    </board>
  )
}

export default ManualThroughViaBoard
