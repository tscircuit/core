import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("coordinate routes follow translated, rotated and flipped footprints", () => {
  const { circuit } = getTestFixture()
  const rotations = [0, 90, 180, 270]
  // Expected transformed first endpoint (-2,-1); footprint flip negates X.
  const topStarts = [
    [-2, -1],
    [1, -2],
    [2, 1],
    [-1, 2],
  ]
  const bottomStarts = [
    [2, -1],
    [1, 2],
    [-2, 1],
    [-1, -2],
  ]
  circuit.add(
    <board width={44} height={24}>
      {(["top", "bottom"] as const).flatMap((layer, row) =>
        rotations.map((rotation, column) => (
          <chip
            key={`${row}-${column}`}
            name={`U${row * 4 + column + 1}`}
            pcbX={column * 10 - 15}
            pcbY={row === 0 ? 5 : -5}
            pcbRotation={rotation}
            layer={layer}
            footprint={
              <footprint>
                <pcbtrace
                  thickness={0.4}
                  layer="top"
                  route={[
                    { x: -2, y: -1 },
                    { x: 2, y: 1 },
                  ]}
                />
              </footprint>
            }
          />
        )),
      )}
      <pcbnotetext
        text="Top / flipped: 0, 90, 180, 270 degrees"
        pcbY={10}
        fontSize={0.7}
      />
    </board>,
  )
  circuit.render()
  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(8)
  traces.forEach((trace, index) => {
    const column = index % 4
    const row = Math.floor(index / 4)
    const [dx, dy] = (row === 0 ? topStarts : bottomStarts)[column]
    const cx = column * 10 - 15,
      cy = row === 0 ? 5 : -5
    expect(trace.route[0]).toMatchObject({
      route_type: "wire",
      layer: row === 0 ? "top" : "bottom",
      width: 0.4,
    })
    const first = trace.route[0]
    const last = trace.route[1]
    if (first.route_type !== "wire" || last.route_type !== "wire")
      throw new Error("Expected wire endpoints")
    expect(first.x).toBeCloseTo(cx + dx)
    expect(first.y).toBeCloseTo(cy + dy)
    expect(last.x).toBeCloseTo(cx - dx)
    expect(last.y).toBeCloseTo(cy - dy)
  })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
