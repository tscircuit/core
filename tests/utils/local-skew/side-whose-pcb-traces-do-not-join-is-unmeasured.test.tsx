import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a side whose PCB traces leave a gap between its pins is reported as unmeasured", () => {
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
          [{ x: 9, y: 0 }, ".ESD > .pin1"],
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
        text="DP is two PCB traces with a 1 mm gap at x = -4"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const { localSkews, unmeasuredPairs } = computeLocalSkew({
    circuitJson: circuit.getCircuitJson(),
  })
  expect(localSkews).toEqual([])
  expect(
    unmeasuredPairs.map(({ sourceTrace, reason }) => [
      sourceTrace.name,
      reason,
    ]),
  ).toEqual([["DP", "pins_not_joined"]])
})
