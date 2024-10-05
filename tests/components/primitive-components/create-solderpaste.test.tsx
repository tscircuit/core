import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("create solderpaste", async () => {
  const { circuit, logSoup } = getTestFixture()
  circuit.add(
    <board width="12mm" height="10mm">
      <solderpaste radius={1} shape="circle" layer={"top"} pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const solderPaste = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_solder_paste")[0]
  expect(solderPaste.shape).toBe("circle")
  expect(solderPaste.pcb_smtpad_id).toBe("")

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
