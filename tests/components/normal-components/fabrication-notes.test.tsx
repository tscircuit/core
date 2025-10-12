import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication note path, text and rect are created", async () => {
  const { circuit, logSoup } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fabricationnoterect
        width={2}
        height={1}
        pcbX={3}
        pcbY={3}
        strokeWidth={0.2}
        isFilled
        hasStroke={false}
        color="rgba(255, 255, 255, 0.5)"
      />
      <fabricationnotepath
        route={[
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
          {
            x: 0,
            y: 0,
          },
        ]}
        strokeWidth={0.1}
      />
      <fabricationnotetext text={"hello world!"} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_fabrication_note_text.list()).toHaveLength(1)
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(1)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
