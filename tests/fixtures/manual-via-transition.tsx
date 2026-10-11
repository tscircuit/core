export function DisconnectedManualViaPcbPathBoard() {
  return (
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 3, y: 0 },
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "bottom",
            toLayer: "inner2",
          },
          { x: 3, y: 0 },
          { x: 5, y: 0 },
          {
            x: 5,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 5, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Invalid: top trace enters a bottom-to-inner2 via"
      />
    </board>
  )
}

export function DisconnectedManualViaPcbPathsBoard() {
  return (
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPaths={[
          [
            "R1.pin2",
            { x: 3, y: 0 },
            {
              x: 3,
              y: 0,
              via: true,
              fromLayer: "bottom",
              toLayer: "inner2",
            },
            { x: 3, y: 0 },
            { x: 5, y: 0 },
            {
              x: 5,
              y: 0,
              via: true,
              fromLayer: "inner2",
              toLayer: "top",
            },
            { x: 5, y: 0 },
            "R2.pin1",
          ],
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Invalid: top trace enters a bottom-to-inner2 via"
      />
    </board>
  )
}

export function ConnectedManualViaPcbPathBoard() {
  return (
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        pcbPath={[
          "R1.pin2",
          { x: 3, y: 0 },
          {
            x: 3,
            y: 0,
            via: true,
            fromLayer: "top",
            toLayer: "inner2",
          },
          { x: 3, y: 0 },
          { x: 5, y: 0 },
          {
            x: 5,
            y: 0,
            via: true,
            fromLayer: "inner2",
            toLayer: "top",
          },
          { x: 5, y: 0 },
          "R2.pin1",
        ]}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={4}
        fontSize={0.6}
        text="Valid: top trace enters a top-to-inner2 via"
      />
    </board>
  )
}
