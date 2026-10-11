export function ManualViaPhysicalSpanPcbPathBoard() {
  return (
    <board
      width={30}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias={false}
      pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.7 }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={6} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 2, y: 0 },
          {
            x: 2,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "inner2",
          },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          {
            x: 4,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "inner1",
          },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
          {
            x: 5,
            y: 0,
            via: true,
            fromLayer: "inner1",
            toLayer: "inner2",
          },
          { x: 5, y: 0 },
          { x: 6, y: 0 },
          {
            x: 6,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 6, y: 0 },
          { x: 7, y: 0 },
          {
            x: 7,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "bottom",
          },
          { x: 7, y: 0 },
          { x: 8, y: 0 },
          {
            x: 8,
            y: 0,
            via: true,
            fromLayer: "bottom",
            toLayer: "top",
          },
          { x: 8, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Blind vias disabled: every via should span all four layers"
      />
    </board>
  )
}
