import { Fragment } from "react"
/** Imported-board workload: explicit board-world positions in mm (+X right,
 * +Y up, +Z out of the board), pre-routed copper, source traces and netted vias.
 * Footprint pads use footprint-local mm offsets on the same right-handed axes.
 * No external footprints, autorouter, schematic, or copper pours are needed.
 */
export const Benchmark3ImportedNetResolution = ({
  componentCount = 1500,
  declaredNets = true,
}: { componentCount?: number; declaredNets?: boolean }) => {
  const netCount = Math.min(componentCount, 1054)
  return (
    <board width={200} height={200} routingDisabled schematicDisabled>
      {Array.from({ length: componentCount }, (_, i) => {
        const x = (i % 40) * 4 - 80
        const y = Math.floor(i / 40) * 4 - 80
        const net = `net.N${i % netCount}`
        const route = [
          {
            route_type: "wire" as const,
            x: x - 0.5,
            y,
            layer: "top" as const,
            width: 0.2,
          },
          {
            route_type: "wire" as const,
            x,
            y: y + 1,
            layer: "top" as const,
            width: 0.2,
          },
        ]
        return (
          <Fragment key={i}>
            <resistor
              name={`R${i}`}
              resistance="1k"
              pcbX={x}
              pcbY={y}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["pin1"]}
                    pcbX={-0.5}
                    pcbY={0}
                    shape="rect"
                    width={0.5}
                    height={0.6}
                  />
                  <smtpad
                    portHints={["pin2"]}
                    pcbX={0.5}
                    pcbY={0}
                    shape="rect"
                    width={0.5}
                    height={0.6}
                  />
                </footprint>
              }
            />
            <trace from={`R${i}.pin1`} to={net} />
            <trace from={`R${i}.pin2`} to={net} />
            <via
              name={`V${i}`}
              pcbX={x}
              pcbY={y + 1}
              holeDiameter={0.3}
              outerDiameter={0.6}
              fromLayer="top"
              toLayer="bottom"
              connectsTo={net}
            />
            <pcbtrace route={route} />
          </Fragment>
        )
      })}
      {declaredNets &&
        Array.from({ length: netCount }, (_, i) => (
          <Fragment key={i}>
            <net name={`N${i}`} />
          </Fragment>
        ))}
    </board>
  )
}
