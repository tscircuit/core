import { expect, test } from "bun:test"
import { runAllRoutingChecks } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("on a 0.8 mm board, local skew and the bus length skew error count the same via length", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="6mm" thickness="0.8mm" routeRemaining={false}>
      <testpoint
        name="P1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={0.3}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        padDiameter={0.3}
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="DP"
        from=".P1 > .pin1"
        to=".P2 > .pin1"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <trace
        name="DN"
        from=".N1 > .pin1"
        to=".N2 > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
          { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
        ]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
        maxLengthSkew="0.1mm"
      />
      <pcbnotetext
        pcbY={2}
        fontSize={0.4}
        text="DN hops to bottom and back: 2 x 0.8 mm of via"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const [lengthSkewError] = (await runAllRoutingChecks(circuitJson)).filter(
    (error) => error.type === "pcb_bus_length_skew_error",
  )
  const [localSkew] = circuitJson.filter(
    (element) => String(element.type) === "pcb_differential_pair_local_skew",
  )
  expect(lengthSkewError.actual_length_skew).toBeCloseTo(1.6, 9)
  expect(localSkew).toMatchObject({ max_local_skew: 1.6 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
