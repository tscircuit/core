import { test, expect, spyOn } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SmtPad with positive and negative solder mask margin", async () => {
  const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})
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
        coveredWithSolderMask={true}
      />
      <silkscreentext
        pcbX={-4}
        pcbY={1.2}
        text="+0.2mm"
        fontSize="0.4mm"
        anchorAlignment="center"
      />
      <smtpad
        shape="rect"
        layer="top"
        width={2}
        height={1}
        portHints={["2"]}
        pcbX={0}
        solderMaskMargin={-0.1}
        coveredWithSolderMask={true}
      />
      <silkscreentext
        pcbX={0}
        pcbY={1.2}
        text="-0.1mm"
        fontSize="0.4mm"
        anchorAlignment="center"
      />
      <smtpad
        shape="circle"
        layer="top"
        radius={0.6}
        portHints={["3"]}
        pcbX={4}
        pcbY={1}
        solderMaskMargin={0.15}
        coveredWithSolderMask={true}
      />
      <silkscreentext
        pcbX={4}
        pcbY={2.1}
        text="+0.15mm"
        fontSize="0.4mm"
        anchorAlignment="center"
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
      <silkscreentext
        pcbX={4}
        pcbY={-2.1}
        text="-0.05mm"
        fontSize="0.4mm"
        anchorAlignment="center"
      />
    </footprint>
  )

  circuit.add(
    <board width="12mm" height="6mm">
      <chip name="U1" layer="top" footprint={footprint} />
    </board>,
  )

  circuit.render()

  expect(consoleWarnSpy).toHaveBeenCalledTimes(4)
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    "Warning: coveredWithSolderMask is true but solderMaskMargin is also set on SmtPad. When a component is fully covered with solder mask, a margin doesn't apply.",
  )

  const circuitJson = circuit.getCircuitJson()
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })

  consoleWarnSpy.mockRestore()
})
