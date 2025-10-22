import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnotedimension renders between explicit points", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotedimension
        from={{ x: 1, y: 2 }}
        to={{ x: 6, y: 2 }}
        text="5mm"
        arrowSize={0.8}
        fontSize={1.5}
        color="#ffffff"
      />
    </board>,
  )

  circuit.render()

  const dimensions = circuit.db.pcb_note_dimension.list()
  expect(dimensions).toHaveLength(1)
  expect(dimensions[0]).toMatchObject({
    type: "pcb_note_dimension",
    from: { x: 1, y: 2 },
    to: { x: 6, y: 2 },
    text: "5mm",
    font: "tscircuit2024",
    font_size: 1.5,
    color: "#ffffff",
    arrow_size: 0.8,
  })
  expect(dimensions[0].pcb_component_id).toBeUndefined()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("pcbnotedimension defaults text to measured distance", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotedimension from={{ x: 1, y: 1 }} to={{ x: 6, y: 1 }} />
      <pcbnotedimension from={{ x: 0, y: 0 }} to={{ x: 1.234, y: 0 }} />
    </board>,
  )

  circuit.render()

  const dimensions = circuit.db.pcb_note_dimension.list()
  expect(dimensions).toHaveLength(2)
  expect(dimensions[0].text).toBe("5mm")
  expect(dimensions[1].text).toBe("1.23mm")
})
