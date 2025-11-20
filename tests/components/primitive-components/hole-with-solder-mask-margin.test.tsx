import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole with positive and negative solder mask margin", () => {
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
            <hole
              pcbX="-4mm"
              pcbY="-2mm"
              diameter="1mm"
              solderMaskMargin={-0.1}
              coveredWithSolderMask={true}
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
            <hole
              pcbX="0mm"
              pcbY="-2mm"
              width="1.5mm"
              height="1mm"
              shape="rect"
              solderMaskMargin={-0.05}
              coveredWithSolderMask={true}
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
            <hole
              pcbX="4mm"
              pcbY="-2mm"
              width="2mm"
              height="1mm"
              shape="pill"
              solderMaskMargin={-0.15}
              coveredWithSolderMask={true}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
