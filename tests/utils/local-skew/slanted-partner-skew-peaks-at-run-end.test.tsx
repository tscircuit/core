import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("a slanted partner's skew peaks at the run's end knot", () => {
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
        pcbPath={[{ x: 2, y: 0 }]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 22, y: -0.28 },
        ]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.8mm"
      />
      <pcbnotetext
        pcbY={8}
        fontSize={0.5}
        text="a slanted partner's skew peaks at the run's end knot"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,0.3  N -12,-0.3  skew 0
    P -10,0.3  N -10,-0.3  skew 0
    P 10,0.3  N 10,-0.58  skew -0.00196"
  `)
})
