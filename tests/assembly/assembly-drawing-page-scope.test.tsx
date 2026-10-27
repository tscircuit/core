import { expect, test } from "bun:test"
import { assembly } from "lib"
import { lampBase, LampShade } from "./fixtures/reference-surface-lamp"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing pages isolate sibling references and resolve geometry within each assembly device", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="PRODUCT">
      {["A", "B"].map((name, i) => (
        <assembly.device key={name} name={name}>
          {i === 0 ? (
            <assembly.part name="housing" cadModel={{ jscad: lampBase }} />
          ) : (
            <assembly.printedpart name="housing" jscad={<LampShade />} />
          )}
          <assembly.drawing.page
            name={name}
            size="ansi_a"
            orientation="portrait"
          >
            <assembly.drawing.titleblock
              title={i === 0 ? "LAMP BASE" : "LAMP SHADE"}
              identificationNumber={`LMP-001-${name}`}
              revisionIndex="A"
              creator="tscircuit"
              legalOwner="tscircuit"
              approvalPerson="PRELIMINARY"
              dateOfIssue="2026-10-21"
              sheetNumber={1}
              numberOfSheets={1}
            />
            <assembly.drawing.partview
              partRef=".housing"
              name="plan"
              displayName="TOP VIEW"
              direction="z+"
              width={60}
              height={50}
              centerX={-30}
              centerY={50}
            />
            <assembly.drawing.partview
              partRef=".housing"
              name="side"
              displayName="ISOMETRIC"
              direction="isometric"
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
