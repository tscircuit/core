import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("manual trace crossing a concave board notch reports an outside-board error", async () => {
  // Board-world point coordinates in mm: +X right, +Y up, +Z above,
  // right-handed. Numeric pcbPath entries below use the R1 footprint-local frame.
  const outline = [
    { x: -3, y: -3 },
    { x: 3, y: -3 },
    { x: 3, y: 3 },
    { x: 1, y: 3 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: -1, y: 3 },
    { x: -3, y: 3 },
  ]
  const routes = [
    {
      name: "CROSSING",
      pcbPath: ["R1.pin2", "R2.pin1"],
      outside: true,
    },
    {
      name: "DETOUR",
      pcbPath: ["R1.pin2", { x: 0, y: -4 }, { x: 4, y: -4 }, "R2.pin1"],
      outside: false,
    },
  ]

  for (const route of routes) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board outline={outline} schematicDisabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-2}
          pcbY={2}
        />
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          pcbX={2}
          pcbY={2}
        />
        <trace
          name={route.name}
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          thickness={0.15}
          pcbPath={route.pcbPath}
        />
        <pcbnotetext
          text={
            route.outside
              ? "TRACE CROSSES EMPTY NOTCH"
              : "DETOUR STAYS ON THE BOARD"
          }
          pcbX={0}
          pcbY={-2}
          fontSize={0.3}
          anchorAlignment="center"
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const traces = circuit.db.pcb_trace.list()
    expect(traces).toHaveLength(1)
    const wirePositions = traces[0].route.filter(
      (routePoint) => routePoint.route_type === "wire",
    )
    expect(
      wirePositions.every(
        ({ x, y }) =>
          x >= -3 &&
          x <= 3 &&
          y >= -3 &&
          y <= 3 &&
          (x <= -1 || x >= 1 || y <= -1),
      ),
    ).toBe(true)
    const outsideBoardErrors = circuit.db.pcb_trace_error
      .list()
      .filter((error) =>
        error.message.includes("routed outside the board boundaries"),
      )
    expect(outsideBoardErrors).toHaveLength(route.outside ? 1 : 0)
    if (route.outside) {
      expect(outsideBoardErrors[0].source_trace_id).toBe(
        circuit.db.source_trace.list()[0].source_trace_id,
      )
      expect(outsideBoardErrors[0].pcb_trace_id).toBe(traces[0].pcb_trace_id)
      expect(outsideBoardErrors[0].message).toContain("R1")
      expect(outsideBoardErrors[0].message).toContain("R2")
      expect(outsideBoardErrors[0].pcb_port_ids).toHaveLength(2)
      expect(wirePositions[0].x).toBeLessThan(-1)
      expect(wirePositions.at(-1)!.x).toBeGreaterThan(1)
      expect(wirePositions.every(({ y }) => y === 2)).toBe(true)
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
    }
  }
})
