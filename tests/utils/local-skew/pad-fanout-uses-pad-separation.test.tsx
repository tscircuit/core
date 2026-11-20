import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("parallel stretches leaving wider source and load pads couple at each end's own pad separation", () => {
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
        pcbY={0.6}
      />
      <testpoint
        name="TN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-0.6}
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".TP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 3, y: 0 },
          { x: 3, y: 0.9 },
          { x: 3.5, y: 0.9 },
          { x: 3.5, y: 0 },
          { x: 4, y: 0 },
          { x: 6, y: -1.2 },
          { x: 18, y: -1.2 },
          { x: 20, y: -0.9 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 4, y: 0 },
          { x: 6, y: 1.2 },
          { x: 18, y: 1.2 },
          { x: 20, y: 0.9 },
          { x: 20.5, y: 0.9 },
          { x: 20.5, y: 0 },
          { x: 21, y: 0 },
          { x: 21, y: 0.9 },
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
        text="parallel stretches leaving wider source and load pads couple at each end's own pad separation"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -12,1.5  N -12,-1.5  skew 0
    P -9,1.5  N -9,-1.5  skew 0
    P -8.5,1.5  N -8.5,-1.5  skew 1.8
    P -8,1.5  N -8,-1.5  skew 1.8
    P -6,0.3  N -6,-0.3  skew 1.8
    P 6,0.3  N 6,-0.3  skew 1.8
    P 8,0.6  N 8,-0.6  skew 1.8
    P 8.5,0.6  N 8.5,-0.6  skew 1.8
    P 9,0.6  N 9,-0.6  skew 0
    P 12,0.6  N 12,-0.6  skew 0"
  `)
})
