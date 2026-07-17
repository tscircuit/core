import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a deep blind via spans through inner8 on a ten-layer board", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" layers={10}>
      <via pcbX={0} pcbY={0} fromLayer="top" toLayer="inner8" />
    </board>,
  )

  project.render()

  const [pcbVia] = project.db.pcb_via.list()
  expect(pcbVia.layers).toEqual([
    "top",
    "inner1",
    "inner2",
    "inner3",
    "inner4",
    "inner5",
    "inner6",
    "inner7",
    "inner8",
  ])
})
