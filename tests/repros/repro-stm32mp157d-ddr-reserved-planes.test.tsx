import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "tests/fixtures/stm32mp157d-reserved-planes/circuit/Board"

// DDR byte 0 data runs between U70 and U71 on inner3. Every signal via from
// the TOP pads crosses the reserved inner1 GND and inner2 power pours.
test("bus_lanes routes STM32MP157D DDR byte 0 across reserved inner planes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Board route routingMode="fanout-ddr" />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()

  // Current behavior: bus-lanes-solver 0.0.65 finds no via site and routes
  // none of the nine requested signals.
  const autoroutingErrors = json.flatMap((e) =>
    e.type === "pcb_autorouting_error" ? [e.message] : [],
  )
  expect(autoroutingErrors).toEqual([
    expect.stringContaining(
      "Native carrier matching exhausted its routing plans",
    ),
  ])
  expect(json.filter((e) => e.type === "pcb_trace")).toHaveLength(0)

  const svgOptions = { shouldDrawErrors: false, showErrorsInTextOverlay: false }
  expect(json).toMatchPcbSnapshot(import.meta.path, svgOptions)
  expect(
    convertCircuitJsonToPcbSvg(json, {
      ...svgOptions,
      width: 900,
      height: 1320,
      viewport: { minX: -4, maxX: 22, minY: 10, maxY: 48 },
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "repro-stm32mp157d-ddr-reserved-planes-ddr",
  )
}, 300_000)
