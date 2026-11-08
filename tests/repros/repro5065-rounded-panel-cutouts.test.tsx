import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rounded panel corners use continuous routing slots instead of sliver rectangles", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={2}
      col={2}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      {Array.from({ length: 4 }, (_, boardIndex) => (
        <board
          key={boardIndex}
          width="14mm"
          height="18mm"
          borderRadius="2mm"
          schematicDisabled
        >
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
          <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={2} />
          <trace from=".R1 > .pin2" to=".C1 > .pin1" />
          <pcbnotetext text="R2 mm corners" pcbY={5} fontSize={0.8} />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const cutouts = circuit.db.pcb_cutout.list()
  const invalidRectangles = cutouts.filter(
    (cutout) =>
      cutout.shape === "rect" &&
      (cutout.corner_radius ?? 0) > Math.min(cutout.width, cutout.height) / 2,
  )
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(invalidRectangles).toHaveLength(0)
  // Clamping each tiny rectangle's radius would still leave a comb of slots.
  expect(cutouts.length).toBeLessThanOrEqual(32)
})
