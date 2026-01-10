import { test, expect, spyOn } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole with positive and negative solder mask margin", () => {
  const consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {})
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <hole
              pcbX="-4mm"
              pcbY="2mm"
              diameter="1mm"
              solderMaskMargin={0.2}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="-4mm"
              pcbY="3.2mm"
              text="+0.2mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <hole
              pcbX="-4mm"
              pcbY="-2mm"
              diameter="1mm"
              solderMaskMargin={-0.1}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="-4mm"
              pcbY="-3.2mm"
              text="-0.1mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <hole
              pcbX="0mm"
              pcbY="2mm"
              width="1.5mm"
              height="1mm"
              shape="rect"
              solderMaskMargin={0.15}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="0mm"
              pcbY="3.2mm"
              text="+0.15mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <hole
              pcbX="0mm"
              pcbY="-2mm"
              width="1.5mm"
              height="1mm"
              shape="rect"
              solderMaskMargin={-0.05}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="0mm"
              pcbY="-3.2mm"
              text="-0.05mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <hole
              pcbX="4mm"
              pcbY="2mm"
              width="2mm"
              height="1mm"
              shape="pill"
              solderMaskMargin={0.25}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="4mm"
              pcbY="3.2mm"
              text="+0.25mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <hole
              pcbX="4mm"
              pcbY="-2mm"
              width="2mm"
              height="1mm"
              shape="pill"
              solderMaskMargin={-0.15}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="4mm"
              pcbY="-3.2mm"
              text="-0.15mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(consoleWarnSpy).toHaveBeenCalledTimes(6)
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    "Warning: coveredWithSolderMask is true but solderMaskMargin is also set on Hole. When a component is fully covered with solder mask, a margin doesn't apply.",
  )

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })

  consoleWarnSpy.mockRestore()
})
