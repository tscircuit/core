import { test, expect } from "bun:test"
import { grid } from "@tscircuit/math-utils"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pushbutton schematic rotations in grid", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      {grid({ rows: 2, cols: 2, xSpacing: 6, ySpacing: 6 }).map(
        ({ center: { x, y }, index }) => (
          <Fragment key={index}>
            <pushbutton
              name={`PB${index + 1}`}
              schX={x}
              schY={y}
              schRotation={index * 90}
            />
            <trace from={`.PB${index + 1} .pin1`} to="net.PIN1" />
            <trace from={`.PB${index + 1} .pin2`} to="net.PIN2" />
          </Fragment>
        ),
      )}
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
