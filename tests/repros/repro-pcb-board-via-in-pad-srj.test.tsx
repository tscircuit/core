import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "../../lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const createRoutingPolicySvg = ({
  circuitJsonAllowsViaInPad,
  simpleRouteJsonAllowsViaInPad,
}: {
  circuitJsonAllowsViaInPad: boolean
  simpleRouteJsonAllowsViaInPad: boolean | undefined
}) => {
  const simpleRouteJsonValue =
    simpleRouteJsonAllowsViaInPad === undefined
      ? "not emitted"
      : String(simpleRouteJsonAllowsViaInPad)
  const valueColor =
    simpleRouteJsonAllowsViaInPad === true ? "#22c55e" : "#ef4444"

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
    <rect width="600" height="420" fill="#0f1720" />
    <text x="32" y="54" fill="#f8fafc" font-family="Arial, sans-serif" font-size="24" font-weight="700">Via-in-pad routing policy</text>
    <text x="32" y="116" fill="#94a3b8" font-family="Arial, sans-serif" font-size="17">Circuit JSON</text>
    <text x="32" y="150" fill="#e2e8f0" font-family="monospace" font-size="17">is_via_in_pad_allowed</text>
    <text x="450" y="150" fill="#22c55e" font-family="monospace" font-size="17" font-weight="700">${circuitJsonAllowsViaInPad}</text>
    <line x1="32" y1="184" x2="568" y2="184" stroke="#334155" />
    <text x="32" y="236" fill="#94a3b8" font-family="Arial, sans-serif" font-size="17">Simple Route JSON</text>
    <text x="32" y="270" fill="#e2e8f0" font-family="monospace" font-size="17">allowViaInPad</text>
    <text x="390" y="270" fill="${valueColor}" font-family="monospace" font-size="17" font-weight="700">${simpleRouteJsonValue}</text>
    <text x="32" y="338" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">Thermal vias inside the exposed pad require this</text>
    <text x="32" y="365" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">policy to remain enabled for the autorouter.</text>
  </svg>`
}

test("via-in-pad board policy is preserved in Simple Route JSON", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="8mm"
      height="8mm"
      layers={8}
      isViaInPadAllowed
      routingDisabled
    >
      <net name="GND" />
      <chip
        name="U1"
        pinLabels={{ pin17: ["GND"] }}
        connections={{ pin17: "net.GND" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin17"]}
              pcbX="0mm"
              pcbY="0mm"
              width="2.74mm"
              height="2.74mm"
              shape="rect"
            />
            <via
              pcbX="0.5mm"
              pcbY="0.5mm"
              outerDiameter="0.61mm"
              holeDiameter="0.3mm"
              layers={["top", "inner1"]}
            />
            <via
              pcbX="-0.5mm"
              pcbY="0.5mm"
              outerDiameter="0.61mm"
              holeDiameter="0.3mm"
              layers={["top", "inner1"]}
            />
            <via
              pcbX="-0.5mm"
              pcbY="-0.5mm"
              outerDiameter="0.61mm"
              holeDiameter="0.3mm"
              layers={["top", "inner1"]}
            />
            <via
              pcbX="0.5mm"
              pcbY="-0.5mm"
              outerDiameter="0.61mm"
              holeDiameter="0.3mm"
              layers={["top", "inner1"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        pcbY="-3mm"
        fontSize="0.45mm"
        text="BLIND THERMAL VIAS INSIDE EXPOSED PAD"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const pcbBoard = circuit.db.pcb_board.list()[0]
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })

  expect(pcbBoard.is_via_in_pad_allowed).toBe(true)

  const comparisonSvg = stackSvgsHorizontally(
    [
      convertCircuitJsonToPcbSvg(circuitJson),
      createRoutingPolicySvg({
        circuitJsonAllowsViaInPad: pcbBoard.is_via_in_pad_allowed ?? false,
        simpleRouteJsonAllowsViaInPad: simpleRouteJson.allowViaInPad,
      }),
    ],
    { gap: 24, normalizeSize: false },
  )

  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0.01,
  })
})
