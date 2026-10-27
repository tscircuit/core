import { expect, test } from "bun:test"
import { assembly } from "lib"
import { ExtrudeLinear, Rectangle } from "jscad-fiber/model"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing dimensions reject invalid structure and unresolved geometry atomically", async () => {
  const model = (
    <ExtrudeLinear height={10} topOutlineName="rim">
      <Rectangle size={[40, 20]} />
    </ExtrudeLinear>
  )
  for (const [partRef, edgeRef, error] of [
    [".tube", ".tube > .missing", "matched 0 named model features"],
    [".tube", ".other > .rim", "matched 0 named model features"],
    [".device", ".rim", "matched 2 named model features"],
    [".empty", undefined, "no geometry to dimension"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device name="device">
        <assembly.printedpart name="tube" jscad={model} />
        <assembly.printedpart name="other" jscad={model} />
        <assembly.part name="empty" />
        <assembly.drawing.page size="iso_a4">
          <assembly.drawing.partview
            name="valid"
            partRef=".tube"
            direction="z+"
            width={50}
            height={50}
          >
            <assembly.drawing.dimension widthOfView />
          </assembly.drawing.partview>
          <assembly.drawing.partview
            name="invalid"
            partRef={partRef}
            direction="z+"
            width={50}
            height={50}
          >
            {edgeRef ? (
              <assembly.drawing.dimension edgeRef={edgeRef} />
            ) : (
              <assembly.drawing.dimension widthOfView />
            )}
          </assembly.drawing.partview>
        </assembly.drawing.page>
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
    expect(circuit.db.drawing_page.list()).toHaveLength(0)
    expect(circuit.db.drawing_part_view.list()).toHaveLength(0)
    expect(circuit.db.drawing_dimension_line.list()).toHaveLength(0)
  }
  for (const [child, error] of [
    [
      <assembly.drawing.dimension widthOfView />,
      "must belong to a drawing part view",
    ],
    [
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.dimension heightOfView />
      </assembly.drawing.page>,
      "must belong to a drawing part view",
    ],
    [
      <assembly.drawing.page size="iso_a4">
        <assembly.drawing.partview
          partRef=".tube"
          direction="z+"
          width={50}
          height={50}
        >
          <assembly.part name="nested" />
        </assembly.drawing.partview>
      </assembly.drawing.page>,
      "can contain only dimensions",
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.printedpart name="tube" jscad={model} />
        {child}
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
  }
})
