import { expect, test } from "bun:test"
import { segmentToBoxMinDistance } from "@tscircuit/math-utils"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nested routes respect zero and non-default cutout edge clearances", async () => {
  for (const clearance of [0.2, 0, 0.5]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width={24}
        height={18}
        autorouter="auto-local"
        schematicDisabled
        minBoardEdgeClearance={clearance}
      >
        <group name="Child" subcircuit width={22} height={16}>
          {[-7, 7].map((pcbX, index) => (
            <chip
              key={pcbX}
              name={`J${index + 1}`}
              pcbX={pcbX}
              pinLabels={{ pin1: ["SIGNAL"] }}
              footprint={
                <footprint>
                  <smtpad
                    portHints={["pin1"]}
                    shape="rect"
                    width={1}
                    height={1}
                  />
                </footprint>
              }
            />
          ))}
          <trace from=".J1 > .pin1" to=".J2 > .pin1" />
        </group>
        <cutout shape="rect" width={4} height={8} />
      </board>,
    )
    await circuit.renderUntilSettled()
    const traces = circuit.db.pcb_trace.list()
    expect(traces).toHaveLength(1)
    let minimum = Infinity
    const route = traces[0].route
    expect(route.every((point) => point.route_type === "wire")).toBe(true)
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1]
      const b = route[i]
      if (a.route_type !== "wire" || b.route_type !== "wire") continue
      minimum = Math.min(
        minimum,
        segmentToBoxMinDistance(a, b, {
          center: { x: 0, y: 0 },
          width: 4,
          height: 8,
        }) -
          Math.max(a.width, b.width) / 2,
      )
    }
    expect(Number.isFinite(minimum)).toBe(true)
    expect(minimum).toBeGreaterThanOrEqual(clearance - 1e-6)
    if (clearance === 0) expect(minimum).toBeLessThan(0.2)

    const child = circuit.db.source_group.getWhere({ name: "Child" })!
    const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuit_id: child.subcircuit_id,
      minBoardEdgeClearance: 0.35,
    })
    expect(simpleRouteJson.minBoardEdgeClearance).toBe(0.35)
    expect(simpleRouteJson.obstacles.map(({ width }) => width).sort()).toEqual([
      1, 1, 4.7,
    ])
    // The keepout must never change the physical opening or export geometry.
    expect(circuit.db.pcb_cutout.list()[0]).toMatchObject({
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 4,
      height: 8,
    })
  }
})
