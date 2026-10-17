import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a board's steps run in ascending order, whatever order they are written in", async () => {
  const { circuit } = getTestFixture()
  const runs: string[] = []
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        name="third"
        order={2}
        fn={() => {
          runs.push("third")
        }}
      />
      <pcbpostroutingstep
        name="first"
        order={-1}
        fn={() => {
          runs.push("first")
        }}
      />
      <pcbpostroutingstep
        name="second"
        fn={() => {
          runs.push("second")
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(runs).toEqual(["first", "second", "third"])
})
