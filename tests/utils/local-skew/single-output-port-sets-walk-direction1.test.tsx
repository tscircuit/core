import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("when only the positive trace has an output port, the negative trace aligns to it by end distance", () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board routeRemaining={false} width="40mm" height="20mm">
      <chip
        name="U_RX"
        pcbX={-12}
        pcbY={0}
        pinAttributes={{ pin1: { isInput: true }, pin2: { isInput: true } }}
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
      <chip
        name="U_TX"
        pcbX={12}
        pcbY={0}
        pinAttributes={{ pin1: { isOutput: true }, pin2: {} }}
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
        from=".U_RX > .pin1"
        to=".U_TX > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 21, y: 0.3 },
          { x: 21.5, y: 1.3 },
          { x: 22, y: 0.3 },
        ]}
      />
      <trace
        name="DN"
        from=".U_RX > .pin2"
        to=".U_TX > .pin2"
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
        pcbY={6}
        fontSize={0.5}
        text="when only the positive trace has an output port, the negative trace aligns to it by end distance"
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P 12,0.3  N 12,-0.3  skew 0
    P 10,0.3  N 10,-0.3  skew 0
    P 9,0.3  N 9,-0.3  skew 1.23607
    P -12,0.3  N -12,-0.3  skew 1.23607"
  `)
})
