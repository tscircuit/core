import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing pages isolate sibling references and resolve geometry within each assembly device", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="PRODUCT">
      {["A", "B"].map((name, i) => (
        <assembly.device key={name} name={name}>
          <assembly.part
            name="housing"
            cadModel={{ jscad: { type: "cuboid", size: [20 + 10 * i, 12, 6] } }}
          />
          <assembly.drawing.page
            name={name}
            size="ansi_a"
            orientation="portrait"
          >
            <assembly.drawing.titleblock
              title={`Assembly ${name} — isolated geometry and view names`}
            />
            <assembly.drawing.partview
              partRef=".housing"
              name="plan"
              direction="z+"
              width={60}
              height={50}
              centerX={-30}
              centerY={50}
            />
            <assembly.drawing.partview
              partRef=".housing"
              name="side"
              direction="x+"
              width={60}
              height={50}
              rightOfRef=".plan"
              centerY={50}
            />
          </assembly.drawing.page>
        </assembly.device>
      ))}
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const pages = circuit.db.drawing_page.list()
  expect(pages.map((page) => [page.width, page.height])).toEqual([
    [215.9, 279.4],
    [215.9, 279.4],
  ])
  const views = circuit.db.drawing_part_view.list()
  expect(views[0].source_component_ids).toEqual(views[1].source_component_ids)
  expect(views[2].source_component_ids).toEqual(views[3].source_component_ids)
  expect(views[0].source_component_ids).not.toEqual(
    views[2].source_component_ids,
  )
  expect(views[1].center).toEqual({ x: 30, y: 50 })
  expect(views[3].center).toEqual({ x: 30, y: 50 })
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path, {
    drawingPageId: pages[1].drawing_page_id,
  })
})
