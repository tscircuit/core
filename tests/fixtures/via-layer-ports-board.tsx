import type { LayerRef } from "circuit-json"
import { Fragment } from "react"

export function ViaLayerPortsBoard({
  layerCount = 4,
  fromLayer,
  toLayer,
  explicitLayers,
  traceLayer = "inner2",
  nested = false,
}: {
  layerCount?: 2 | 4 | 6 | 8 | 10
  fromLayer?: LayerRef
  toLayer?: LayerRef
  explicitLayers?: LayerRef[]
  traceLayer?: LayerRef
  nested?: boolean
}) {
  const viasAndTrace = (
    <>
      {([-2, 2] as const).map((pcbX, i) => (
        <Fragment key={pcbX}>
          <via
            name={i === 0 ? "VA" : "VB"}
            pcbX={pcbX}
            pcbY={0}
            fromLayer={fromLayer}
            toLayer={toLayer}
            layers={explicitLayers}
            holeDiameter={0.3}
            outerDiameter={0.7}
            connectsTo="net.SIG"
          />
        </Fragment>
      ))}
      <trace
        from={`VA.${traceLayer}`}
        to={`VB.${traceLayer}`}
        thickness={0.2}
        pcbPath={[`VA.${traceLayer}`, `VB.${traceLayer}`]}
      />
    </>
  )
  return (
    <board width={20} height={12} layers={layerCount} routeRemaining={false}>
      {nested ? <group subcircuit>{viasAndTrace}</group> : viasAndTrace}
    </board>
  )
}
