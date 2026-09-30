import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  Am3352DogboneFootprint,
  balls,
  createAm3352DogbonePaths,
} from "tests/fixtures/am3352-dogbone"

test("pad-site matcher dogbones all AM3352 balls including power and ground", async () => {
  const paths = createAm3352DogbonePaths()
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
      <fanout name="local_dogbones" pcbTracePaths={paths}>
        <Am3352DogboneFootprint />
        {balls.map(({ ball, signal }) => (
          <trace from={`U1.${ball}`} to={`net.${signal}`} />
        ))}
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
      {balls
        .filter((b) => b.kind !== "signal")
        .map(({ ball, x, y, kind }) => (
          <pcbnotetext
            pcbX={x}
            pcbY={y}
            fontSize={0.21}
            text={kind === "ground" ? "G" : "P"}
          />
        ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(324)
  expect(circuit.db.pcb_via.list()).toHaveLength(324)
  expect(circuit.db.pcb_trace.list()).toHaveLength(324)
  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(324)
  for (const via of circuit.db.pcb_via.list()) {
    expect(via.layers).toEqual(["top", "inner1", "inner2", "bottom"])
  }
  expect(balls.filter((b) => b.kind === "ground")).toHaveLength(43)
  expect(balls.filter((b) => b.kind === "power")).toHaveLength(76)
  const starts = new Set<string>()
  for (const trace of circuit.db.pcb_trace.list()) {
    const first = trace.route[0]!
    const vias = trace.route.filter((p) => p.route_type === "via")
    expect(vias).toHaveLength(1)
    const via = vias[0]!
    if (first.route_type !== "wire")
      throw new Error("Dogbone must start with a wire")
    starts.add(`${first.x.toFixed(4)},${first.y.toFixed(4)}`)
    expect(
      circuit.db.pcb_smtpad
        .list()
        .some(
          (pad) =>
            pad.shape === "circle" &&
            Math.hypot(pad.x - first.x, pad.y - first.y) < 1e-6,
        ),
    ).toBe(true)
    // Every emitted trace is just the local half-pitch diagonal, never a boundary run.
    expect(Math.abs(via.x - first.x)).toBeCloseTo(0.4, 6)
    expect(Math.abs(via.y - first.y)).toBeCloseTo(0.4, 6)
    expect(Math.abs(via.x)).toBeLessThanOrEqual(7.200001)
    expect(Math.abs(via.y)).toBeLessThanOrEqual(7.200001)
  }
  expect(starts.size).toBe(324)
  expect(
    circuit.getCircuitJson().filter((e) => e.type.endsWith("_error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 60_000)
