import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("without the compensating detour, the positive trace stays longer all the way to the load", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="30mm" height="8mm">
      <testpoint
        name="TP_DP_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={0.3}
      />
      <testpoint
        name="TP_DN_SRC"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={-12}
        pcbY={-0.3}
      />
      <testpoint
        name="TP_DP_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={0.3}
      />
      <testpoint
        name="TP_DN_LOAD"
        footprintVariant="pad"
        padDiameter="0.3mm"
        doNotPlace
        pcbX={12}
        pcbY={-0.3}
      />
      <trace
        name="USB_DP"
        from=".TP_DP_SRC > .pin1"
        to=".TP_DP_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 2, y: 0 },
          { x: 2.5, y: 1 },
          { x: 3, y: 0 },
        ]}
      />
      <trace
        name="USB_DN"
        from=".TP_DN_SRC > .pin1"
        to=".TP_DN_LOAD > .pin1"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <differentialpair
        name="USB"
        positiveConnection="USB_DP"
        negativeConnection="USB_DN"
        pcbTraceGap="0.45mm"
        maxLengthSkew="0.1mm"
      />
      <pcbnotetext
        pcbY={3}
        fontSize={0.5}
        text="without the compensating detour, the positive trace stays longer all the way to the load"
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
    P -9,0.3  N -9,-0.3  skew 1.23607
    P 12,0.3  N 12,-0.3  skew 1.23607"
  `)
})
