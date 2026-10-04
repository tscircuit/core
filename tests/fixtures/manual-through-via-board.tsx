/** All positions are board-world mm, +X right, +Y up; component routes are local. */
export function ManualThroughViaBoard({
  allowBlindAndBuriedVias = false,
} = {}) {
  return (
    <board
      width={16}
      height={10}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias={allowBlindAndBuriedVias}
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
              <smtpad
                portHints={["1"]}
                shape="circle"
                radius={0.4}
                pcbX={0}
                pcbY={0}
              />
            </footprint>
          }
        />
      ))}
      <trace
        from="J1.pin1"
        to="J2.pin1"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 2, y: 0, via: true, fromLayer: "top", toLayer: "inner1" },
          { x: 4, y: 0 },
          { x: 4, y: 0, via: true, fromLayer: "inner1", toLayer: "inner2" },
          { x: 6, y: 0 },
          { x: 6, y: 0, via: true, fromLayer: "inner2", toLayer: "top" },
        ]}
      />
      <net name="GND" />
      <via
        name="GND_STITCH"
        pcbX={0}
        pcbY={-3}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter={0.6}
        holeDiameter={0.3}
        connectsTo="net.GND"
      />
      <copperpour
        name="BOTTOM_GND"
        layer="bottom"
        connectsTo="net.GND"
        clearance={0.2}
      />
      <pcbnotetext
        text="Manual trace uses top / inner1 / inner2"
        pcbY={3.8}
        fontSize={0.5}
      />
      <pcbnotetext
        text={
          allowBlindAndBuriedVias
            ? "Blind vias enabled: bottom GND stays solid"
            : "Through vias: bottom GND must clear all barrels"
        }
        pcbY={2.8}
        fontSize={0.45}
      />
    </board>
  )
}
