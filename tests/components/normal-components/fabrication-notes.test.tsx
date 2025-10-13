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
      <fabricationnotedimension
        from={{ x: 0, y: 0 }}
        to={{ x: 5, y: 0 }}
        text="5mm"
        arrowSize={0.8}
        offset={1.2}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.pcb_fabrication_note_text.list()).toHaveLength(1)
  expect(circuit.db.pcb_fabrication_note_path.list()).toHaveLength(1)
  const dimensions = circuit.db.pcb_fabrication_note_dimension.list()
  expect(dimensions).toHaveLength(1)
  expect(dimensions[0]).toMatchObject({
    type: "pcb_fabrication_note_dimension",
    from: { x: 0, y: 0 },
    to: { x: 5, y: 0 },
    text: "5mm",
    offset: 1.2,
    arrow_size: 0.8,
    font: "tscircuit2024",
    layer: "top",
  })

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
