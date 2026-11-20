import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("a detour where the pair widens to pad pitch shows as skew, measured at the pad pitch", () => {
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
          { x: 2, y: 0 },
          { x: 2.15, y: -0.15 },
          { x: 16, y: -0.15 },
          { x: 16.15, y: 0 },
          { x: 18, y: 0 },
          { x: 18, y: 2.2225 },
          { x: 20, y: 2.2225 },
          { x: 20, y: 0 },
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".TN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 2.15, y: 0.15 },
          { x: 16, y: 0.15 },
          { x: 16.15, y: 0 },
        ]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.15mm"
      />
      <pcbnotetext
        pcbY={8}
        fontSize={0.5}
        text="a detour where the pair widens to pad pitch shows as skew, measured at the pad pitch"
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
    P -9.85,0.15  N -9.85,-0.15  skew 0
    P 4,0.15  N 4,-0.15  skew 0
    P 4.15,0.3  N 4.15,-0.3  skew 0
    P 6,0.3  N 6,-0.3  skew 0
    P 8,0.3  N 8,-0.3  skew 4.445
    P 12,0.3  N 12,-0.3  skew 4.445"
  `)
})
