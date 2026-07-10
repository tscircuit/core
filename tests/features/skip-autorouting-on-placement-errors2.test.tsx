import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("placementDrcChecksDisabled allows autorouting with overlapping components", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  let autoroutingStartCount = 0

  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width="12mm"
      height="8mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <pcbnotetext
        pcbY={-3}
        fontSize={0.7}
        text="PLACEMENT DRC DISABLED: ROUTING ALLOWED"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(autoroutingStartCount).toBe(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
})
