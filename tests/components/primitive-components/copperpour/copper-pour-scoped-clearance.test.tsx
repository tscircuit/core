import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("per-net copper gaps and authored fixed copper survive core rendering", async () => {
  const { circuit } = getTestFixture()
  const footprint = (
    <footprint>
      <smtpad shape="rect" width={1} height={1} portHints={["1"]} />
    </footprint>
  )
  circuit.add(
    <board width={18} height={12} routingDisabled>
      <net name="GND" />
      <net name="HV" />
      <net name="LV" />
      <chip
        name="H"
        pcbX={-5}
        footprint={footprint}
        connections={{ pin1: "net.HV" }}
      />
      <chip
        name="L"
        pcbX={5}
        footprint={footprint}
        connections={{ pin1: "net.LV" }}
      />
      <copperpour
        layer="top"
        connectsTo="net.HV"
        isStatic
        outline={[
          { x: -0.5, y: -1 },
          { x: 0.5, y: -1 },
          { x: 0.5, y: 1 },
          { x: -0.5, y: 1 },
        ]}
      />
      <copperpour
        layer="top"
        connectsTo="net.GND"
        clearance={0.1}
        boardEdgeMargin={0.4}
        clearanceRules={[
          { clearance: 1.5, netSelectors: ["net.HV"], objectTypes: ["smtpad"] },
          {
            clearance: 0.8,
            netSelectors: ["net.HV"],
            objectTypes: ["copper_region"],
          },
          { clearance: 0.2, objectTypes: ["smtpad"] },
        ]}
      />
      <pcbnotetext
        text="GND pour: scoped gaps, fixed copper preserved"
        pcbY={4.6}
        fontSize={0.45}
      />
      <pcbnotetext text="HV: 1.5 mm" pcbX={-5} pcbY={-3} fontSize={0.45} />
      <pcbnotetext text="Fixed HV: 0.8 mm" pcbY={-3} fontSize={0.45} />
      <pcbnotetext text="LV: 0.2 mm" pcbX={5} pcbY={-3} fontSize={0.45} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pours = circuit.db.pcb_copper_pour.list()
  const fixed = pours.find((pour) => pour.is_static)
  const generated = pours.find((pour) => !pour.is_static)
  if (fixed?.shape !== "brep" || generated?.shape !== "brep")
    throw new Error("Expected generated and fixed copper")
  // Board-world emitted geometry: mm, +X right, +Y up; positions include translation.
  const bounds = (vertices: { x: number; y: number }[]) => ({
    minX: Math.min(...vertices.map((p) => p.x)),
    maxX: Math.max(...vertices.map((p) => p.x)),
    minY: Math.min(...vertices.map((p) => p.y)),
    maxY: Math.max(...vertices.map((p) => p.y)),
  })
  expect(bounds(fixed.brep_shape.outer_ring.vertices)).toEqual({
    minX: -0.5,
    maxX: 0.5,
    minY: -1,
    maxY: 1,
  })
  const holes = generated.brep_shape.inner_rings
    .map((ring) => bounds(ring.vertices))
    .sort((a, b) => a.minX - b.minX)
  expect(holes).toHaveLength(3)
  expect(holes[0]?.minX).toBeCloseTo(-7)
  expect(holes[0]?.maxX).toBeCloseTo(-3)
  expect(holes[1]?.minX).toBeCloseTo(-1.3)
  expect(holes[1]?.maxX).toBeCloseTo(1.3)
  expect(holes[2]?.minX).toBeCloseTo(4.3)
  expect(holes[2]?.maxX).toBeCloseTo(5.7)
  expect(bounds(generated.brep_shape.outer_ring.vertices).maxX).toBeCloseTo(8.6)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, { layer: "top" })
})
