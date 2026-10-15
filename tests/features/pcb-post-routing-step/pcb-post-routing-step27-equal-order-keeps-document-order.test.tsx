import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("steps with the same order run in the order they appear", async () => {
  const { circuit } = getTestFixture()
  const runs: string[] = []
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        order={1}
        fn={() => {
          runs.push("a")
        }}
      />
      <pcbpostroutingstep
        order={1}
        fn={() => {
          runs.push("b")
        }}
      />
      <pcbpostroutingstep
        order={1}
        fn={() => {
          runs.push("c")
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(runs).toEqual(["a", "b", "c"])
})
