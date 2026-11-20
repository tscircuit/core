import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { CircuitJson } from "circuit-json"
import type { ReactElement } from "react"
import { DETOUR_EXTRA_LENGTH } from "./differential-pair-board"

export { DETOUR_EXTRA_LENGTH }

/** The direction attributes a chip pin is given. */
type PinAttributes = { isOutput?: boolean; isInput?: boolean }

/** Options for {@link DirectedPairBoard}. */
export type DirectedPairBoardProps = {
  /** Mark the receiver pins as outputs too, making direction ambiguous. */
  bothEndsOutput?: boolean
  /** Route the negative trace from the output chip instead of the receiver. */
  negativeFromOutput?: boolean
  /** Which trace(s) have `isOutput` set on `U_TX`. Defaults to `"both"`. */
  outputSide?: "both" | "positive" | "negative"
}

/**
 * A pair whose output driver (`U_TX`) sits on the right (x = 12) and receiver
 * (`U_RX`) on the left (x = -12). Both traces are routed from `U_RX` to `U_TX`
 * by default — backwards relative to signal flow — with a positive detour near
 * `U_TX` (x = 9..10).
 */
export function DirectedPairBoard({
  bothEndsOutput = false,
  negativeFromOutput = false,
  outputSide = "both",
}: DirectedPairBoardProps): ReactElement {
  let rxPinAttrs: PinAttributes = { isInput: true }
  if (bothEndsOutput) rxPinAttrs = { isOutput: true }
  let txPin1Attrs: PinAttributes = { isOutput: true }
  if (outputSide === "negative") txPin1Attrs = {}
  let txPin2Attrs: PinAttributes = { isOutput: true }
  if (outputSide === "positive") txPin2Attrs = {}
  let negativeFrom = ".U_RX > .pin2"
  let negativeTo = ".U_TX > .pin2"
  if (negativeFromOutput) {
    negativeFrom = ".U_TX > .pin2"
    negativeTo = ".U_RX > .pin2"
  }
  return (
    <board routeRemaining={false} width="40mm" height="20mm" layers={2}>
      <chip
        name="U_RX"
        pcbX={-12}
        pcbY={0}
        pinAttributes={{
          pin1: rxPinAttrs,
          pin2: rxPinAttrs,
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={-0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="U_TX"
        pcbX={12}
        pcbY={0}
        pinAttributes={{
          pin1: txPin1Attrs,
          pin2: txPin2Attrs,
        }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
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
        from=".U_RX > .pin1"
        to=".U_TX > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 21, y: 0.3 },
          { x: 21.5, y: 1.3 },
          { x: 22, y: 0.3 },
        ]}
      />
      <trace
        name="DN"
        from={negativeFrom}
        to={negativeTo}
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

/** Renders {@link DirectedPairBoard} through core. */
export function renderDirectedPairBoard(
  props: DirectedPairBoardProps = {},
): CircuitJson {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(<DirectedPairBoard {...props} />)
  return circuit.getCircuitJson()
}
