import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a step that throws is reported by name and the next step still runs", async () => {
  const { circuit } = getTestFixture()
  const runs: string[] = []
  circuit.add(
    <board width="16mm" height="10mm">
      <pcbpostroutingstep
        name="pads"
        order={1}
        fn={() => {
          throw new Error("no room")
        }}
      />
      <pcbpostroutingstep
        order={2}
        fn={() => {
          runs.push("labels")
        }}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(runs).toEqual(["labels"])
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_autorouting_error")
      .map((e: any) => e.message),
  ).toEqual(['<pcbpostroutingstep name="pads" /> failed: no room'])
})
