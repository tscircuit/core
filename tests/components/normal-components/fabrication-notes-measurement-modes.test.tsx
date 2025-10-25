import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabricationnotedimension supports edge measurement modes with offsets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <hole name="FH1" pcbX={0} pcbY={0} diameter={2} />
      <hole name="FH2" pcbX={10} pcbY={0} diameter={2} />
      <fabricationnotedimension from="FH1" to="FH2" centerToCenter offset={0} />
      <fabricationnotedimension
        from="FH1"
        to="FH2"
        innerEdgeToEdge
        offset={2}
      />
      <fabricationnotedimension
        from="FH1"
        to="FH2"
        outerEdgeToEdge
        offset={4}
      />
    </board>,
  )

  circuit.render()

  const dimensions = circuit.db.pcb_fabrication_note_dimension.list()
  expect(dimensions).toHaveLength(3)

  const [center, inner, outer] = dimensions
  expect(center.from).toMatchObject({ x: 0, y: 0 })
  expect(center.to).toMatchObject({ x: 10, y: 0 })
  expect(center.text).toBe("10mm")

  expect(inner.from).toMatchObject({ x: 1, y: 0 })
  expect(inner.to).toMatchObject({ x: 9, y: 0 })
  expect(inner.text).toBe("8mm")

  expect(outer.from).toMatchObject({ x: -1, y: 0 })
  expect(outer.to).toMatchObject({ x: 11, y: 0 })
  expect(outer.text).toBe("12mm")
})
