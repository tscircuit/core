import { expect, it } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("pcb_via.layers includes intermediate inner layers on a 4-layer board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" layers={4}>
      <via pcbX="0mm" pcbY="0mm" fromLayer="top" toLayer="bottom" />
    </board>,
  )

  project.render()

  const [pcbVia] = project.db.pcb_via.list()
  expect(pcbVia.layers).toEqual(["top", "inner1", "inner2", "bottom"])
  expect(pcbVia.from_layer).toBe("top")
  expect(pcbVia.to_layer).toBe("bottom")
})

it("pcb_via.layers spans only the crossed layers for a partial-span via", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" layers={4}>
      <via pcbX="0mm" pcbY="0mm" fromLayer="top" toLayer="inner2" />
    </board>,
  )

  project.render()

  const [pcbVia] = project.db.pcb_via.list()
  expect(pcbVia.layers).toEqual(["top", "inner1", "inner2"])
})

it("pcb_via.layers stays [top, bottom] on a 2-layer board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <via pcbX="0mm" pcbY="0mm" fromLayer="top" toLayer="bottom" />
    </board>,
  )

  project.render()

  const [pcbVia] = project.db.pcb_via.list()
  expect(pcbVia.layers).toEqual(["top", "bottom"])
})
