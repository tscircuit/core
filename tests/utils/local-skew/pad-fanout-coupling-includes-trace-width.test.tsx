import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("pad fan-outs include trace width in their coupling limit", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="40mm" height="20mm">
      <testpoint
        name="TP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={1.5}
      />
      <testpoint
        name="TN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-1.5}
      />
      <testpoint
        name="TP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={1.5}
      />
      <testpoint
        name="TN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-1.5}
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".TP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 4, y: 0 },
          { x: 4.5, y: 0.05 },
          { x: 5, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 1, y: -0.7 },
          { x: 4, y: -0.7 },
          { x: 6, y: 2.4 },
          { x: 18, y: 2.4 },
          { x: 20, y: 0 },
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
        text="pad fan-outs include trace width in their coupling limit"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -11,1.5  N -11,-2.2  skew -0.22066
    P -8,1.5  N -8,-2.2  skew -0.22066
    P -6,1.5  N -6,0.9  skew -1.90484
    P 6,1.5  N 6,0.9  skew -1.90484
    P 8,1.5  N 8,-1.5  skew -3.02894
    P 12,1.5  N 12,-1.5  skew -3.02894"
  `)
})
