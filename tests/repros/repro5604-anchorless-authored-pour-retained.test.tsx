import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("the anchorless net warning references the surviving authored pour", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="10mm" layers={2}>
      <copperpour connectsTo="net.GND" layer="bottom" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const json = circuit.getCircuitJson()
  const pours = json.filter((element) => element.type === "pcb_copper_pour")
  const warnings = json.filter(
    (element) => element.type === "pcb_copper_pour_isolated_warning",
  )
  expect(pours).toHaveLength(1)
  expect(warnings).toHaveLength(1)
  expect(warnings[0]!.pcb_copper_pour_id).toBe(pours[0]!.pcb_copper_pour_id)
  expect(warnings[0]!.message).not.toContain("was removed")
})
