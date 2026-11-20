import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson, LayerRef } from "circuit-json"
import type { ReactElement } from "react"

/** A `pcbPath` point, relative to the trace's start port. */
export type PairPathPoint = {
  x: number
  y: number
  via?: boolean
  fromLayer?: LayerRef
  toLayer?: LayerRef
}

/** Options for {@link PairBoard}. */
export type PairBoardProps = {
  positivePath: PairPathPoint[]
  negativePath?: PairPathPoint[]
  /** Edge-to-edge gap, e.g. "0.45mm". Leave out to test an undeclared gap. */
  pcbTraceGap?: string
  /** Route the negative trace from its load pad back to its source pad. */
  negativeFromLoad?: boolean
  /** Declare the positive trace as both members, which core accepts. */
  positiveOnBothSides?: boolean
  /** Copper width of the positive trace. Defaults to "0.15mm", like the negative. */
  positiveThickness?: string
  /** Number of copper layers on the board. Defaults to 2. */
  layers?: 2 | 4
  /** Board thickness, e.g. "0.8mm". Defaults to core's 1.6 mm. */
  thickness?: string
  /** Optional fabricator preset, which emits a `pcb_stackup`. */
  fabricatorPreset?: "jlcpcb_standard"
  /** Half the centre-to-centre distance between the source pads, in mm. Defaults to 0.3. */
  sourcePadHalfPitch?: number
  /** Half the centre-to-centre distance between the load pads, in mm. Defaults to 0.3. */
  loadPadHalfPitch?: number
  /** Differential pair name. Defaults to "PAIR". */
  pairName?: string
  /** Optional subcircuit group containing the pair. */
  subcircuitName?: string
}

/**
 * A board with source pads at x = -12 and load pads at x = 12.
 * By default the positive trace's pads are at y = 0.3 and the negative's at
 * y = -0.3, so a straight pair is 0.6 mm apart centre to centre with 0.15 mm traces.
 */
export function PairBoard({
  positivePath,
  negativePath,
  pcbTraceGap,
  negativeFromLoad,
  positiveOnBothSides,
  positiveThickness = "0.15mm",
  layers = 2,
  thickness,
  fabricatorPreset,
  sourcePadHalfPitch = 0.3,
  loadPadHalfPitch = 0.3,
  pairName = "PAIR",
  subcircuitName,
}: PairBoardProps): ReactElement {
  let negativeFrom = ".TN_SRC > .pin1"
  let negativeTo = ".TN_LOAD > .pin1"
  if (negativeFromLoad) {
    negativeFrom = ".TN_LOAD > .pin1"
    negativeTo = ".TN_SRC > .pin1"
  }
  let negativeConnection = "DN"
  if (positiveOnBothSides) negativeConnection = "DP"
  const pair = (
    <>
      <testpoint
        name="TP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={sourcePadHalfPitch}
      />
      <testpoint
        name="TN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-sourcePadHalfPitch}
      />
      <testpoint
        name="TP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={loadPadHalfPitch}
      />
      <testpoint
        name="TN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-loadPadHalfPitch}
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".TP_LOAD > .pin1"
        thickness={positiveThickness}
        pcbPath={positivePath}
      />
      <trace
        name="DN"
        from={negativeFrom}
        to={negativeTo}
        thickness="0.15mm"
        pcbPath={negativePath}
      />
      <differentialpair
        name={pairName}
        positiveConnection="DP"
        negativeConnection={negativeConnection}
        pcbTraceGap={pcbTraceGap}
      />
    </>
  )
  let content = pair
  if (subcircuitName !== undefined) {
    content = (
      <group subcircuit name={subcircuitName}>
        {pair}
      </group>
    )
  }
  return (
    <board
      routeRemaining={false}
      width="40mm"
      height="20mm"
      layers={layers}
      thickness={thickness}
      fabricatorPreset={fabricatorPreset}
    >
      {content}
    </board>
  )
}

/** Renders {@link PairBoard} through core. */
export function renderPairBoard(props: PairBoardProps): CircuitJson {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(<PairBoard {...props} />)
  return circuit.getCircuitJson()
}
