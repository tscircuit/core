import { beforeAll, expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const withoutPour = getTestFixture().circuit
const withPour = getTestFixture().circuit

beforeAll(async () => {
  // Reduced from a four-layer H3/DDR3 HDMI streaming-stick design. This
  // generic BGA isolates ground fanout; it is not the processor footprint.
  for (const circuit of [withoutPour, withPour]) {
    circuit.schematicDisabled = true
    circuit.add(
      <board
        width={12}
        height={12}
        layers={4}
        routeRemaining={false}
        minTraceWidth={0.1}
        minViaHoleDiameter={0.2}
        minViaPadDiameter={0.4}
        minTraceToPadEdgeClearance={0.1}
        minViaEdgeToPadEdgeClearance={0.1}
      >
        <fanout autorouter="dogbone">
          <chip
            name="U1"
            footprint="bga16_grid4x4_p0.8mm_pad0.35mm_circularpads"
            connections={{ pin1: "net.GND", pin6: "net.GND" }}
          />
        </fanout>
        {circuit === withPour && (
          <copperpour layer="inner1" connectsTo="net.GND" />
        )}
        <pcbnotetext
          pcbY={4}
          text={circuit === withPour ? "With inner1 GND pour" : "Without pour"}
          fontSize={0.5}
        />
        <pcbnotetext
          pcbY={-4}
          text="Expected: 2 ground escapes"
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
  }

  expect(withoutPour.db.pcb_autorouting_error.list()).toEqual([])
  expect(withoutPour.db.pcb_trace.list()).toHaveLength(2)
  expect(withoutPour.db.pcb_via.list()).toHaveLength(2)

  await expect(
    stackSvgsHorizontally(
      [withoutPour, withPour].map((circuit) =>
        convertCircuitJsonToPcbSvg(circuit.getCircuitJson()),
      ),
    ),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})

test("adding a ground pour preserves the two BGA dogbone escapes", () => {
  expect(withPour.db.pcb_autorouting_error.list()).toEqual([])
  expect(withPour.db.pcb_trace.list()).toHaveLength(2)
  expect(withPour.db.pcb_via.list()).toHaveLength(2)
})
