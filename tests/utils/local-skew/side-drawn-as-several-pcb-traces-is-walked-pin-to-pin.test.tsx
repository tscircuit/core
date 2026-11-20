import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("a side drawn as several PCB traces is walked pin to pin, leaving out a stub", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="30mm" height="12mm">
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
      <chip
        name="ESD"
        pcbX={12}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={0}
              pcbY={0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0}
              pcbY={-0.3}
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <trace
        name="DP"
        from=".TP_SRC > .pin1"
        to=".ESD > .pin1"
        thickness="0.15mm"
        pcbPathRelativeTo=".TP_SRC > .pin1"
        pcbPaths={[
          [".TP_SRC > .pin1", { x: 8, y: 0 }],
          [
            { x: 8, y: 0 },
            { x: 8, y: 2 },
          ],
          [{ x: 8, y: 0 }, ".ESD > .pin1"],
        ]}
      />
      <trace
        name="DN"
        from=".TN_SRC > .pin1"
        to=".ESD > .pin2"
        thickness="0.15mm"
        pcbPath={[]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap="0.45mm"
      />
      <pcbnotetext
        pcbY={4}
        fontSize={0.5}
        text="DP is three PCB traces: source to x = -4, a stub up to y = 2.3, and x = -4 to the ESD pad"
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
    P 12,0.3  N 12,-0.3  skew 0"
  `)
})
