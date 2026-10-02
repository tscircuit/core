import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { AM3352 } from "tests/fixtures/am3352-dogbone"

test("dogbone fanout escapes AM3352 power, ground and signal pads locally", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={21}
      layers={4}
      routeRemaining={false}
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      minViaPadDiameter={0.3}
      minViaHoleDiameter={0.15}
    >
      <fanout autorouter="dogbone">
        <AM3352 />
      </fanout>
      <pcbnotetext
        pcbY={9.6}
        fontSize={0.5}
        text="AM3352 ZCZ: 324 local dogbones"
      />
      <pcbnotetext
        pcbY={8.8}
        fontSize={0.3}
        text="P: 76 power-related balls / G: 43 VSS / 205 other balls"
      />
      <pcbnotetext
        pcbY={-9}
        fontSize={0.3}
        text="0.8 mm pitch / 0.10 mm traces / 0.30 mm vias / 0.15 mm drills"
      />
      <pcbnotetext
        pcbY={-9.6}
        fontSize={0.3}
        text="Local escape test only: no boundary runs or plane connections"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(324)
  expect(circuit.db.pcb_via.list()).toHaveLength(324)
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(324)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 60_000)
