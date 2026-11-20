import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("45\u00b0 mitred bends create opposite-sign skew of 2 * d * tan(pi/8) on coupled diagonals", () => {
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
          { x: 6, y: 0 },
          { x: 10, y: 4 },
          { x: 14, y: 4 },
          { x: 18, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 6.24852813742, y: 0 },
          { x: 10.2485281374, y: 4 },
          { x: 13.7514718626, y: 4 },
          { x: 17.7514718626, y: 0 },
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
        text="45\u00b0 mitred bends create opposite-sign skew of 2 * d * tan(pi/8) on coupled diagonals"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,0.3  N -12,-0.3  skew 0
    P -6,0.3  N -6,-0.3  skew 0
    P -6,0.3  N -5.575736,-0.124264  skew -0.49706
    P -2.175736,4.124264  N -1.751472,3.7  skew -0.49706
    P -1.751472,4.3  N -1.751472,3.7  skew 0
    P 1.751472,4.3  N 1.751472,3.7  skew 0
    P 2.175736,4.124264  N 1.751472,3.7  skew 0.49706
    P 6,0.3  N 5.575736,-0.124264  skew 0.49706
    P 6,0.3  N 6,-0.3  skew 0
    P 12,0.3  N 12,-0.3  skew 0"
  `)
})
