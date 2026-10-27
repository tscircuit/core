import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("paired dimensions reject ambiguous, unselected, clipped and zero-distance references atomically", async () => {
  for (const [fromRef, toRef, axis, section, error, fromAnchor] of [
    [".missing", ".H2", "x", undefined, "matched 0 holes"],
    ["hole", ".H2", "x", undefined, "matched 2 holes"],
    [".other .H3", ".H2", "x", undefined, "matched 0 holes"],
    [".H1", ".H1", "x", undefined, "zero projected extent"],
    [".H1", ".H2", "y", undefined, "zero projected extent"],
    [".H1", ".H2", "x", undefined, "hole center; use a center anchor", "left"],
    [
      ".H1",
      ".H2",
      "x",
      { axis: "x", offset: 0, keepSide: "less" },
      "outside the retained section",
    ],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <board name="carrier" width={40} height={30}>
          <hole name="H1" diameter={3} pcbX={-10} />
          <hole name="H2" diameter={3} pcbX={10} />
        </board>
        <board name="other" width={20} height={20} pcbX={80}>
          <hole name="H3" diameter={3} />
        </board>
        <assembly.drawing.page size="iso_a4">
          <assembly.drawing.partview
            name="plan"
            partRef=".carrier"
            direction="z+"
            width={80}
            height={60}
            section={section}
          >
            <assembly.drawing.dimension widthOfView />
            <assembly.drawing.dimension
              fromRef={fromRef}
              toRef={toRef}
              fromAnchor={fromAnchor}
              axis={axis}
            />
          </assembly.drawing.partview>
        </assembly.drawing.page>
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(error)
    expect(circuit.db.drawing_page.list()).toHaveLength(0)
    expect(circuit.db.drawing_dimension_line.list()).toHaveLength(0)
  }
})
