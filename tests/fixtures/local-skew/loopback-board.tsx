import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson } from "circuit-json"
import type { ReactElement } from "react"

/**
 * A loopback: one part carries all four pads, and the negative trace is
 * routed from its load pad back to its source pad. Shared components can't
 * tell the route ends apart here.
 */
export function LoopbackBoard(): ReactElement {
  return (
    <board routeRemaining={false} width="40mm" height="20mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-12}
              pcbY={0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={-12}
              pcbY={-0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX={12}
              pcbY={0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX={12}
              pcbY={-0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <trace
        name="DP"
        from=".U1 > .pin1"
        to=".U1 > .pin3"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <trace
        name="DN"
        from=".U1 > .pin4"
        to=".U1 > .pin2"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <differentialpair
        name="LOOP"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
      />
    </board>
  )
}

/** Renders {@link LoopbackBoard} through core. */
export function renderLoopbackBoard(): CircuitJson {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(<LoopbackBoard />)
  return circuit.getCircuitJson() as CircuitJson
}
