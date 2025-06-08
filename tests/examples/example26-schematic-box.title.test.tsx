import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box component - grid layout for all alignments", async () => {
  const { circuit } = getTestFixture()

  const alignments = [
    "top_left",
    "top_center",
    "top_right",
    "center_left",
    "center",
    "center_right",
    "bottom_left",
    "bottom_center",
    "bottom_right",
  ] as const

  const boxWidth = 3
  const boxHeight = 3
  const columns = 3
  const spacing = 3

  const getX = (i: number) => (i % columns) * (boxWidth + spacing)
  const getY = (row: number) => row * (boxHeight + spacing)

  circuit.add(
    <board width="30mm" height="30mm">
      {alignments.map((alignment, i) => {
        const col = i % columns
        const row = Math.floor(i / columns)

        return (
          <>
            {/* Title Inside (top half) */}
            <schematicbox
              schX={getX(col)}
              schY={getY(row)}
              width={boxWidth}
              height={boxHeight}
              strokeStyle="solid"
              title={`${alignment} (in)`}
              titleInside={true}
              titleAlignment={alignment}
            />

            {/* Title Outside (bottom half) */}
            <schematicbox
              schX={getX(col) + columns * (boxWidth + spacing)}
              schY={getY(row)}
              width={boxWidth}
              height={boxHeight}
              strokeStyle="solid"
              title={`${alignment} (out)`}
              titleInside={false}
              titleAlignment={alignment}
            />
          </>
        )
      })}
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
