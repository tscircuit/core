import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("drawing references and structure reject missing, ambiguous, self and cyclic targets", async () => {
  const view = {
    partRef: ".housing",
    direction: "z+" as const,
    width: 60,
    height: 40,
  }
  const cases = [
    { patch: { rightOfRef: ".missing" }, error: "matched 0 sibling views" },
    { patch: { rightOfRef: ".plan" }, error: "cannot reference itself" },
    {
      patch: { rightOfRef: ".other" },
      other: { rightOfRef: ".plan" },
      error: "placement cycle",
    },
    { patch: { partRef: ".missing" }, error: "matched 0 parts" },
    { patch: { partRef: ".duplicate" }, error: "matched 2 parts" },
    { patch: { partRef: ".page" }, error: "has no source geometry" },
    {
      patch: { belowRef: ".other" },
      duplicateViews: true,
      error: "matched 2 sibling views",
    },
  ]
  for (const { patch, other, duplicateViews, error } of cases) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <assembly.part name="housing" />
        <assembly.part name="duplicate" />
        <assembly.part name="duplicate" />
        <assembly.drawing.page name="page" width={210} height={150}>
          <assembly.drawing.partview {...view} name="plan" {...patch} />
          <assembly.drawing.partview {...view} name="other" {...other} />
          {duplicateViews && (
            <assembly.drawing.partview {...view} name="other" />
          )}
        </assembly.drawing.page>
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
    expect(circuit.db.drawing_page.list()).toHaveLength(0)
    expect(circuit.db.drawing_part_view.list()).toHaveLength(0)
  }
  for (const [children, error] of [
    [<assembly.drawing.partview {...view} />, "must belong to a drawing page"],
    [
      <assembly.drawing.titleblock title="Orphan" />,
      "must belong to a drawing page",
    ],
    [
      <assembly.drawing.page width={100} height={100}>
        <assembly.drawing.titleblock title="First" />
        <assembly.drawing.titleblock title="Second" />
      </assembly.drawing.page>,
      "at most one title block",
    ],
    [
      <assembly.drawing.page width={100} height={100}>
        <assembly.part name="invalid-child" />
      </assembly.drawing.page>,
      "only part views and a title block",
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(<assembly.device>{children}</assembly.device>)
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
  }
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device>
      <assembly.part
        name="housing"
        cadModel={{ jscad: { type: "cuboid", size: [24, 16, 10] } }}
      />
      <assembly.drawing.page width={210} height={150}>
        <assembly.drawing.titleblock title="Valid cross-axis references do not form a cycle" />
        <assembly.drawing.partview
          {...view}
          name="plan"
          displayName="PLAN"
          rightOfRef=".other"
        />
        <assembly.drawing.partview
          {...view}
          name="other"
          displayName="SIDE"
          aboveRef=".plan"
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.drawing_part_view.list().map((view) => view.center),
  ).toEqual([
    { x: 60, y: 0 },
    { x: 0, y: 40 },
  ])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
