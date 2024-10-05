import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("create solderpaste from smtpad", async () => {
  const { circuit, logSoup } = getTestFixture()
  const smtPadWidth = 10
  const smtPadHeight = 10
  circuit.add(
    <board width="12mm" height="10mm">
      <smtpad
        height={smtPadHeight}
        width={smtPadWidth}
        shape="rect"
        layer={"top"}
        pcbX={0}
        pcbY={0}
        portHints={[]}
      />
    </board>,
  )

  circuit.render()
  const solderPaste = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_solder_paste" && elm.shape === "rect")[0]
  const smtPad = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_smtpad")[0]
  expect(solderPaste.height).toBe(smtPadHeight * 0.7)
  expect(smtPad.pcb_smtpad_id).toBe(solderPaste.pcb_smtpad_id!)

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
