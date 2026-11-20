import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson } from "circuit-json"
import type { ReactElement } from "react"

/** Height of the positive trace's triangular detour, in mm. */
const POSITIVE_DETOUR_HEIGHT = 1

/** Length the positive detour adds over the straight path it replaces, in mm. */
export const DETOUR_EXTRA_LENGTH =
  2 * Math.hypot(0.5, POSITIVE_DETOUR_HEIGHT) - 1

/** Depth of the negative trace's square detour, so it adds the same length. */
const NEGATIVE_DETOUR_DEPTH = DETOUR_EXTRA_LENGTH / 2

/**
 * A USB-style differential pair. The positive trace detours right after the
 * source. When `compensated`, the negative trace makes up the same length
 * right before the load, so the totals match but the positive trace is
 * longer for most of the route.
 *
 * Route points are relative to each trace's start port.
 */
export function DifferentialPairBoard({
  compensated,
}: {
  compensated: boolean
}): ReactElement {
  let negativePath: { x: number; y: number }[] = []
  if (compensated) {
    negativePath = [
      { x: 20, y: 0 },
      { x: 20, y: -NEGATIVE_DETOUR_DEPTH },
      { x: 21, y: -NEGATIVE_DETOUR_DEPTH },
      { x: 21, y: 0 },
    ]
  }
  return (
    <board routeRemaining={false} width="30mm" height="8mm">
      <testpoint
        name="TP_DP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={0.3}
      />
      <testpoint
        name="TP_DN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <testpoint
        name="TP_DP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="TP_DN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="USB_DP"
        from=".TP_DP_SRC > .pin1"
        to=".TP_DP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 2.5, y: POSITIVE_DETOUR_HEIGHT },
          { x: 3, y: 0 },
        ]}
      />
      <trace
        name="USB_DN"
        from=".TP_DN_SRC > .pin1"
        to=".TP_DN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={negativePath}
      />
      <differentialpair
        name="USB"
        positiveConnection="USB_DP"
        negativeConnection="USB_DN"
        pcbTraceGap="0.45mm"
        maxLengthSkew="0.1mm"
      />
    </board>
  )
}

/** Renders {@link DifferentialPairBoard} through core. */
export function renderDifferentialPairBoard({
  compensated,
}: {
  compensated: boolean
}): CircuitJson {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(<DifferentialPairBoard compensated={compensated} />)
  return circuit.getCircuitJson()
}
