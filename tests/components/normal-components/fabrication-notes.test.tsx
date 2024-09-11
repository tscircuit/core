import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabrication note path and text are created", async () => {
  const { circuit, logSoup } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
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

  await expect(
    circuit.getSvg({
      view: "pcb",
      layer: "top",
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
