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
        from={{ x: 0, y: -3 }}
        to={{ x: 5, y: -3 }}
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

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("fabricationnoterect defaults hasStroke to true when strokeWidth provided", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fabricationnoterect width={2} height={1} strokeWidth={0.2} />
    </board>,
  )

  circuit.render()

  const rects = circuit.db.pcb_fabrication_note_rect.list()
  expect(rects).toHaveLength(1)
  expect(rects[0].has_stroke).toBe(true)
})

test("fabricationnotedimension defaults text to measured distance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <fabricationnotedimension
        from={{ x: 0, y: 0 }}
        to={{ x: 3, y: 4 }}
        offset={1}
      />
      <fabricationnotedimension
        from={{ x: 0, y: 0 }}
        to={{ x: 0, y: 1.234 }}
        offset={1}
        layer="bottom"
      />
    </board>,
  )

  circuit.render()

  const dimensions = circuit.db.pcb_fabrication_note_dimension.list()
  expect(dimensions).toHaveLength(2)
  expect(dimensions[0].text).toBe("5mm")
  expect(dimensions[1].text).toBe("1.23mm")
})
