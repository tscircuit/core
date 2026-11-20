import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("without pcbTraceGap, a far stretch split into 1 mm points is interpolated, not coupled", () => {
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
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
          { x: 6, y: 0 },
          { x: 7, y: 0 },
          { x: 8, y: 0 },
          { x: 9, y: 0 },
          { x: 10, y: 0 },
          { x: 11, y: 0 },
          { x: 12, y: 0 },
          { x: 13, y: 0 },
          { x: 14, y: 0 },
          { x: 15, y: 0 },
          { x: 16, y: 0 },
          { x: 17, y: 0 },
          { x: 18, y: 0 },
          { x: 19, y: 0 },
          { x: 20, y: 0 },
          { x: 21, y: 0 },
          { x: 22, y: 0 },
          { x: 23, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 1, y: 0 },
          { x: 1, y: -1.4 },
          { x: 2, y: -1.4 },
          { x: 3, y: -1.4 },
          { x: 4, y: -1.4 },
          { x: 5, y: -1.4 },
          { x: 6, y: -1.4 },
          { x: 7, y: -1.4 },
          { x: 8, y: -1.4 },
          { x: 9, y: -1.4 },
          { x: 10, y: -1.4 },
          { x: 11, y: -1.4 },
          { x: 12, y: -1.4 },
          { x: 13, y: -1.4 },
          { x: 14, y: -1.4 },
          { x: 15, y: -1.4 },
          { x: 16, y: -1.4 },
          { x: 17, y: -1.4 },
          { x: 18, y: -1.4 },
          { x: 19, y: -1.4 },
          { x: 20, y: -1.4 },
          { x: 21, y: -1.4 },
          { x: 22, y: -1.4 },
          { x: 23, y: -1.4 },
          { x: 23, y: 0 },
        ]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
      />
      <pcbnotetext
        pcbY={8}
        fontSize={0.5}
        text="without pcbTraceGap, a far stretch split into 1 mm points is interpolated, not coupled"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,0.3  N -12,-0.3  skew 0
    P -11,0.3  N -11,-0.3  skew 0
    P 11,0.3  N 11,-0.3  skew -2.8
    P 12,0.3  N 12,-0.3  skew -2.8"
  `)
})
