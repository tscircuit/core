import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("each board in a panel uses only its own stackup or thickness, never a neighbour's", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <panel width="100mm" height="50mm" layoutMode="grid">
      <board
        routeRemaining={false}
        width="40mm"
        height="20mm"
        thickness="1.6mm"
        fabricatorPreset="jlcpcb_standard"
      >
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
            { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
            { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
          ]}
        />
        <differentialpair
          name="STACKUP"
          positiveConnection="DP"
          negativeConnection="DN"
          pcbTraceGap="0.45mm"
        />
      </board>
      <board
        routeRemaining={false}
        width="40mm"
        height="20mm"
        thickness="0.8mm"
      >
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
            { x: 6, y: 0, via: true, fromLayer: "top", toLayer: "bottom" },
            { x: 18, y: 0, via: true, fromLayer: "bottom", toLayer: "top" },
          ]}
        />
        <differentialpair
          name="PLAIN"
          positiveConnection="DP"
          negativeConnection="DN"
          pcbTraceGap="0.45mm"
        />
      </board>
    </panel>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [firstLocalSkew, secondLocalSkew] = computeLocalSkew({
    circuitJson,
  }).localSkews
  expect(
    formatKnotPoints({ circuitJson, localSkew: firstLocalSkew }),
  ).toMatchInlineSnapshot(`
    "P -33,0.3  N -33,-0.3  skew 0
    P -27,0.3  N -27,-0.3  skew 0
    P -27,0.3  N -27,-0.3  skew -1.49
    P -15,0.3  N -15,-0.3  skew -1.49
    P -15,0.3  N -15,-0.3  skew -2.98
    P -9,0.3  N -9,-0.3  skew -2.98"
  `)
  expect(
    formatKnotPoints({ circuitJson, localSkew: secondLocalSkew }),
  ).toMatchInlineSnapshot(`
    "P 9,0.3  N 9,-0.3  skew 0
    P 15,0.3  N 15,-0.3  skew 0
    P 15,0.3  N 15,-0.3  skew -0.8
    P 27,0.3  N 27,-0.3  skew -0.8
    P 27,0.3  N 27,-0.3  skew -1.6
    P 33,0.3  N 33,-0.3  skew -1.6"
  `)
})
