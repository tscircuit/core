import { expect, test } from "bun:test"
import type { PcbHoleCircle } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("aligned and staggered shared tabs reuse drills without reducing the remaining web", async () => {
  for (const neighborY of [0, 1]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <panel
        width={60}
        height={50}
        boardGap={2}
        panelizationMethod="tab-routing"
      >
        <board width={20} height={20} pcbX={-11} pcbY={0} routingDisabled>
          <pcbnotetext text="SHARED TAB" fontSize={1.2} />
        </board>
        <board
          width={20}
          height={20}
          pcbX={11}
          pcbY={neighborY}
          routingDisabled
        >
          <pcbnotetext text="DRILL ONCE" fontSize={1.2} />
        </board>
      </panel>,
    )
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-offset-${neighborY}`),
    )
    const holes = circuit.db.pcb_hole
      .list()
      .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
    const drillPositions = new Set(
      holes.map((hole) => `${hole.x.toFixed(6)},${hole.y.toFixed(6)}`),
    )
    expect(drillPositions.size).toBe(holes.length)
    // The shared channel is x = -1 .. +1 mm in circuit-world XY.
    for (const rootX of [-1, 1]) {
      expect(
        holes.filter(
          (hole) => Math.abs(hole.x - rootX) < 1e-6 && Math.abs(hole.y) < 4,
        ),
      ).toHaveLength(4)
    }
    let minimumWeb = Infinity
    for (let drillIndex = 0; drillIndex < holes.length; drillIndex++) {
      const drill = holes[drillIndex]!
      for (const otherDrill of holes.slice(drillIndex + 1)) {
        const web =
          Math.hypot(drill.x - otherDrill.x, drill.y - otherDrill.y) -
          (drill.hole_diameter + otherDrill.hole_diameter) / 2
        minimumWeb = Math.min(minimumWeb, web)
      }
    }
    expect(minimumWeb).toBeGreaterThanOrEqual(0.45 - 1e-6)
  }
})
