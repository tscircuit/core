import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Port schStemLength in custom symbol with width/height scaling", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        symbol={
          <symbol width={4} height={2}>
            <schematicline
              x1={-0.5}
              y1={-0.7}
              x2={-0.5}
              y2={0.7}
              strokeWidth={0.05}
            />
            <schematicline
              x1={-0.5}
              y1={0.7}
              x2={0.7}
              y2={0}
              strokeWidth={0.05}
            />
            <schematicline
              x1={0.7}
              y1={0}
              x2={-0.5}
              y2={-0.7}
              strokeWidth={0.05}
            />
            <schematictext schX={-0.35} schY={0.35} text="+" fontSize={0.3} />
            <schematictext schX={-0.35} schY={-0.35} text="-" fontSize={0.3} />
            <port
              name="IN+"
              schX={-1}
              schY={0.35}
              direction="left"
              schStemLength={0.5}
            />
            <port
              name="IN-"
              schX={-1}
              schY={-0.35}
              direction="left"
              schStemLength={0.5}
            />
            <port
              name="OUT"
              schX={1.1}
              schY={0}
              direction="right"
              schStemLength={0.4}
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: { cellSize: 0.5, labelCells: true },
    drawPorts: true,
  })
})
