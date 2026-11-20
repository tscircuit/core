import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("coupled serpentine meander alternates local skew across legs and cancels to zero on exit", () => {
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
        pcbPath={[
          { x: 8.6, y: 0 },
          { x: 8.6, y: -2 },
          { x: 9.6, y: -2 },
          { x: 9.6, y: 2 },
          { x: 11.8, y: 2 },
          { x: 11.8, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 8, y: 0 },
          { x: 8, y: -2 },
          { x: 10.2, y: -2 },
          { x: 10.2, y: 2 },
          { x: 11.2, y: 2 },
          { x: 11.2, y: 0 },
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
        text="coupled serpentine meander alternates local skew across legs and cancels to zero on exit"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,0.3  N -12,-0.3  skew 0
    P -4,0.3  N -4,-0.3  skew 0
    P -3.4,-0.3  N -4,-0.3  skew 1.2
    P -3.4,-1.7  N -4,-1.7  skew 1.2
    P -3.4,-1.7  N -3.4,-2.3  skew 0
    P -2.4,-1.7  N -2.4,-2.3  skew 0
    P -2.4,-1.7  N -1.8,-1.7  skew -1.2
    P -2.4,1.7  N -1.8,1.7  skew -1.2
    P -1.8,2.3  N -1.8,1.7  skew 0
    P -0.8,2.3  N -0.8,1.7  skew 0
    P -0.2,1.7  N -0.8,1.7  skew 1.2
    P -0.2,0.3  N -0.8,0.3  skew 1.2
    P -0.2,0.3  N -0.2,-0.3  skew 0
    P 12,0.3  N 12,-0.3  skew 0"
  `)
})
