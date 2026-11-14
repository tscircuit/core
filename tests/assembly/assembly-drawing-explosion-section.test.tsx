import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exploded section dimensions clip the displayed pose in CAD world coordinates", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <assembly.device name="DEVICE">
      <assembly.part
        name="PLATE"
        cadModel={{ jscad: { type: "cuboid", size: [20, 10, 6] } }}
      />
      <assembly.explosion.stage name="slide">
        <assembly.explosion.move targetRefs="PLATE" offX={8} />
      </assembly.explosion.stage>
      <assembly.drawing.page
        width={280}
        height={140}
        anchorAlignment="bottom_left"
      >
        {[
          { name: "full", factor: 1, section: undefined },
          {
            name: "cut",
            factor: 1,
            section: {
              axis: "x" as const,
              offset: 10,
              keepSide: "less" as const,
            },
          },
          {
            name: "half",
            factor: 0.5,
            section: {
              axis: "x" as const,
              offset: 10,
              keepSide: "less" as const,
            },
          },
        ].map((props, i) => (
          <assembly.drawing.explosionview
            key={props.name}
            {...props}
            displayName={
              i === 0
                ? "FULL PLATE"
                : i === 1
                  ? "CUT AT WORLD X=10"
                  : "HALF FACTOR, SAME CUT"
            }
            stageRef="slide"
            direction="z+"
            width={70}
            height={55}
            centerX={50 + i * 90}
            centerY={75}
          >
            <assembly.drawing.dimension widthOfView />
          </assembly.drawing.explosionview>
        ))}
        <assembly.drawing.note
          text="The same world-space cut retains different widths as the plate moves"
          paperX={20}
          paperY={125}
        />
      </assembly.drawing.page>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(
    circuit.db.drawing_dimension_line.list().map((line) => line.text),
  ).toEqual(["20 mm", "12 mm", "16 mm"])
  await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
})
