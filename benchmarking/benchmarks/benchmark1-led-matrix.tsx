import { grid } from "@tscircuit/math-utils"
import { sel } from "lib/sel"
import type { BoardProps } from "@tscircuit/props"

export const Benchmark1LedMatrix = ({
  autorouter = undefined,
  routingDisabled = undefined,
}: {
  autorouter?: BoardProps["autorouter"]
  routingDisabled?: boolean
}) => {
  if (autorouter === undefined && routingDisabled === undefined) {
    routingDisabled = true
  }
  return (
    <board
      width="50mm"
      height="60mm"
      routingDisabled={routingDisabled}
      autorouter={autorouter}
    >
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={["PWR", "GND"]}
        footprint="pinrow2"
        pcbY={28}
      />
      <trace from={sel.J1.PWR} to={sel.net.PWR} />
      <trace from={sel.J1.GND} to={sel.net.GND} />
      {grid({ rows: 10, cols: 10, xSpacing: 10, ySpacing: 10 }).map(
        ({ center, index }) => {
          const ledName = `LED${index}`
          const resistorName = `R${index}`
          return (
            <group key={ledName}>
              <led
                footprint="0603"
                color="red"
                name={ledName}
                pcbX={center.x}
                pcbY={center.y}
              />
              <resistor
                resistance="1k"
                footprint="0402"
                name={resistorName}
                pcbX={center.x}
                pcbY={center.y - 2}
              />
              <trace from={`.${ledName} .pos`} to={sel.net.PWR} />
              <trace from={`.${ledName} .neg`} to={`.${resistorName} .pos`} />
              <trace from={`.${resistorName} .neg`} to={sel.net.GND} />
            </group>
          )
        },
      )}
    </board>
  )
}
