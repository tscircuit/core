import { expect, test } from "bun:test"
import { assembly } from "lib"
import { HolePlate } from "tests/fixtures/assembly-drawing/hole-plate"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("dimension anchors infer nearest containing edges while respecting explicit anchors and axes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <board name="carrier" width={50} height={30}>
        <hole name="H1" diameter={3} pcbX={17} pcbY={8} />
        <hole name="H2" diameter={5} pcbX={-13} pcbY={-6} />
      </board>
      <assembly.printedpart name="plate" jscad={<HolePlate />} />
      <assembly.drawing.page size="iso_a3">
        <assembly.drawing.titleblock title="INFERRED ANCHORS / EXPLICIT OVERRIDES" />
        <assembly.drawing.partview
          name="pcb"
          displayName="PCB / INFERRED EDGE AND CENTER OVERRIDE"
          partRef=".carrier"
          direction="z+"
          width={85}
          height={65}
          centerX={-100}
          centerY={40}
        >
          <assembly.drawing.dimension
            name="nearest"
            fromRef=".carrier"
            toRef=".carrier .H1"
          />
          <assembly.drawing.dimension
            name="reversed"
            fromRef=".carrier .H1"
            toRef=".carrier"
            axis="x"
          />
          <assembly.drawing.dimension
            name="center"
            fromRef=".carrier"
            fromAnchor="center"
            toRef=".carrier .H1"
          />
          <assembly.drawing.dimension
            name="far_edge"
            fromRef=".carrier"
            fromAnchor="right"
            toRef=".carrier .H1"
            axis="x"
          />
          <assembly.drawing.dimension
            name="top"
            fromRef=".carrier"
            toRef=".carrier .H2"
          />
        </assembly.drawing.partview>
        <assembly.drawing.partview
          name="cad"
          displayName="CAD / INFERRED OUTLINE ANCHORS"
          partRef=".plate"
          direction="z+"
          width={85}
          height={65}
          centerX={65}
          centerY={40}
        >
          <assembly.drawing.dimension
            name="cad_nearest"
            fromRef=".plate > .rim"
            toRef=".plate > .H1"
          />
          <assembly.drawing.dimension
            name="cad_center"
            fromRef=".plate > .rim"
            fromAnchor="center"
            toRef=".plate > .H1"
          />
          <assembly.drawing.dimension
            name="cad_top"
            fromRef=".plate > .H2"
            toRef=".plate > .rim"
          />
        </assembly.drawing.partview>
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const lines = circuit.db.drawing_dimension_line.list()
  expect(lines.map(({ text }) => text)).toEqual([
    "7 mm",
    "8 mm",
    "17 mm",
    "42 mm",
    "9 mm",
    "7 mm",
    "17 mm",
    "9 mm",
  ])
  for (const index of [0, 4, 5, 7]) {
    expect(lines[index]!.start.x).toBeCloseTo(lines[index]!.end.x, 5)
    expect(lines[index]!.edge_ref_start!.x).toBeCloseTo(
      lines[index]!.edge_ref_end!.x,
      5,
    )
  }
  // Inference is derived state, never a mutation of the author's input.
  expect(circuit.selectOne(".nearest")!._parsedProps).toEqual({
    name: "nearest",
    fromRef: ".carrier",
    toRef: ".carrier .H1",
  })
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
