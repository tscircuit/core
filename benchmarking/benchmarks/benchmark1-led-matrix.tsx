import { grid } from "@tscircuit/math-utils"

export const Benchmark1LedMatrix = () => (
  <board width="10mm" height="10mm" routingDisabled>
    {grid({ rows: 4, cols: 4, xSpacing: 5, ySpacing: 5 }).map(
      ({ center, index }) => {
        const ledName = `LED${index}`
        const resistorName = `R${index}`
        return (
          <group key={ledName}>
            <led
              footprint="0603"
              name={ledName}
              pcbX={center.x}
              pcbY={center.y}
              schX={center.x}
              schY={center.y}
            />
            <resistor
              resistance="1k"
              footprint="0402"
              name={resistorName}
              pcbX={center.x}
              pcbY={center.y - 2}
              schX={center.x}
              schY={center.y - 2}
            />
            <trace from={`.${ledName} .pos`} to="net.VDD" />
            <trace from={`.${ledName} .neg`} to={`.${resistorName} .pos`} />
            <trace from={`.${resistorName} .neg`} to="net.GND" />
          </group>
        )
      },
    )}
  </board>
)
