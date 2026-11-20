import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson } from "circuit-json"
import type { ReactElement } from "react"

/**
 * A straight pair where one connector, J1, spans the whole board: it owns
 * the positive trace's start pad on the left and the negative trace's end
 * pad on the right. Both traces are routed left to right.
 */
export function SpanningConnectorBoard(): ReactElement {
  return (
    <board routeRemaining={false} width="40mm" height="20mm">
      <chip
        name="J1"
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
              pcbX={12}
              pcbY={-0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <testpoint
        name="TP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="TN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <trace
        name="DP"
        from=".J1 > .pin1"
        to=".TP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".J1 > .pin2"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
      />
    </board>
  )
}

/** Renders {@link SpanningConnectorBoard} through core. */
export function renderSpanningConnectorBoard(): CircuitJson {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(<SpanningConnectorBoard />)
  return circuit.getCircuitJson()
}
