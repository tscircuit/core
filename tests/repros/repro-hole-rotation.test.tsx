import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: rect and oval holes ignore pcbRotation while pills rotate", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<HoleRotationRepro />)
  circuit.render()

  // This snapshot records the bug, not the desired corrected appearance.
  // Columns: 0/45/90 degrees. Rows: rect/oval/pill (working control).
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

// Reproduction only. Positions are board-space millimetres: +X right, +Y up.
// Explicit placement isolates hole rotation from automatic group placement.
function HoleRotationRepro() {
  return (
    <board width={46} height={38} pcbLayout={{ layoutMode: "none" }}>
      <silkscreentext text="HOLE ROTATION" pcbX={0} pcbY={16} fontSize={1.2} />
      {[0, 45, 90].map((angle, column) => (
        <Fragment key={angle}>
          <silkscreentext
            text={`${angle} deg`}
            pcbX={-12 + column * 12}
            pcbY={12}
            fontSize={1}
          />
        </Fragment>
      ))}
      {(["rect", "oval", "pill"] as const).map((shape, row) => (
        <Fragment key={shape}>
          <silkscreentext
            text={shape.toUpperCase()}
            pcbX={0}
            pcbY={8 - row * 9}
            fontSize={0.9}
          />
          {[0, 45, 90].map((angle, column) => (
            <Fragment key={angle}>
              <hole
                name={`${shape}${angle}`}
                shape={shape}
                width={7}
                height={2}
                pcbX={-12 + column * 12}
                pcbY={4 - row * 9}
                pcbRotation={angle}
              />
            </Fragment>
          ))}
        </Fragment>
      ))}
    </board>
  )
}
