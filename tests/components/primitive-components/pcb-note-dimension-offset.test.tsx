import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB note dimensions emit short oblique offset geometry", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={8}>
      <pcbnotedimension
        from={{ x: -3, y: 0 }}
        to={{ x: 3, y: 0 }}
        offset={0.25}
        offsetDirection={{ x: 1, y: -1 }}
        arrowSize={0.5}
        fontSize={0.5}
        text="short oblique offset"
      />
    </board>,
  )
  circuit.render()

  const dimension = circuit.db.pcb_note_dimension.list()[0]!
  expect(dimension.from).toEqual({ x: -3, y: 0 })
  expect(dimension.to).toEqual({ x: 3, y: 0 })
  expect(dimension.offset_distance).toBe(0.25)
  expect(dimension.offset_direction).toEqual({ x: 1, y: -1 })
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
