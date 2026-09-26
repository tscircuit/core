import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local autorouting preserves an explicit 1.5 mm power trace minimum", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width="36mm"
      height="22mm"
      layers={1}
      autorouter="auto_local"
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.13mm"
    >
      {[-13, 13].map((pcbX, index) => (
        <chip
          key={index}
          name={`U${index + 1}`}
          pcbX={pcbX}
          pinLabels={{ pin1: "POWER" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="rect" width={3} height={3} />
            </footprint>
          }
        />
      ))}
      <chip
        name="U3"
        pinLabels={{ pin1: "BLOCKER_A", pin2: "BLOCKER_B" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={20}
              height={4}
              pcbY={2.8}
            />
            <smtpad
              portHints={["pin2"]}
              shape="rect"
              width={20}
              height={4}
              pcbY={-2.8}
            />
          </footprint>
        }
      />
      <trace
        name="POWER"
        from=".U1 > .pin1"
        to=".U2 > .pin1"
        thickness="1.5mm"
      />
      <pcbnotetext
        text="POWER minimum: 1.5 mm; gap: 1.6 mm; clearance: 0.13 mm"
        pcbY={8}
        fontSize={0.6}
      />
      <pcbnotetext
        text="Expected: full-width detour. Actual: narrowed trace through gap."
        pcbY={-8}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const widths = circuit.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route.flatMap((point) =>
        point.route_type === "wire" ? [point.width] : [],
      ),
    )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(widths.length).toBeGreaterThan(0)
  // Allow pad-entry tapering, but the entire route must not be undersized.
  expect(Math.max(...widths)).toBeGreaterThanOrEqual(1.5)
})
