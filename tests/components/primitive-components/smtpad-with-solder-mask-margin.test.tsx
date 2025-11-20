import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SmtPad with positive and negative solder mask margin", async () => {
  const { circuit } = getTestFixture()

  const footprint = (
    <footprint>
      <smtpad
        shape="rect"
        layer="top"
        width={2}
        height={1}
        portHints={["1"]}
        pcbX={-4}
        solderMaskMargin={0.2}
      />
      <smtpad
        shape="rect"
        layer="top"
        width={2}
        height={1}
        portHints={["2"]}
        pcbX={0}
        solderMaskMargin={-0.1}
      />
      <smtpad
        shape="circle"
        layer="top"
        radius={0.6}
        portHints={["3"]}
        pcbX={4}
        pcbY={1}
        solderMaskMargin={0.15}
      />
      <smtpad
        shape="circle"
        layer="top"
        radius={0.6}
        portHints={["4"]}
        pcbX={4}
        pcbY={-1}
        solderMaskMargin={-0.05}
        coveredWithSolderMask={true}
      />
    </footprint>
  )

  circuit.add(
    <board width="12mm" height="6mm">
      <chip name="U1" layer="top" footprint={footprint} />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const pcb_smtpad = circuitJson.filter((elm) => elm.type === "pcb_smtpad")
  console.log(pcb_smtpad)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
