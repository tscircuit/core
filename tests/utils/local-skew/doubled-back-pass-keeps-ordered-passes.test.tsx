import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("a nearer pass that doubles back doesn't displace the passes in route order", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="40mm" height="20mm">
      <testpoint
        name="TP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
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
      <testpoint
        name="TP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="TN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".TP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 12, y: 0 },
          { x: 12, y: -2 },
          { x: 13, y: -2 },
          { x: 13, y: 0 },
          { x: 22, y: 0 },
          { x: 22, y: -3 },
          { x: -2, y: -3 },
          { x: -2, y: 1.1 },
          { x: 12, y: 1.1 },
          { x: 12, y: 4 },
          { x: 26, y: 4 },
          { x: 26, y: 0 },
        ]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
      />
      <pcbnotetext
        pcbY={8}
        fontSize={0.5}
        text="a nearer pass that doubles back doesn't displace the passes in route order"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,0.3  N -12,-0.3  skew 0
    P 0,0.3  N 0,-0.3  skew 0
    P 1,0.3  N 1,-0.3  skew -4
    P 10,0.3  N 10,-0.3  skew -4"
  `)
})
