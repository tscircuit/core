import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PlatedHole with positive and negative solder mask margin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm">
      <resistor
        name="R1"
        resistance={10}
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="-5mm"
              pcbY="2mm"
              shape="circle"
              outerDiameter={1.5}
              holeDiameter={0.8}
              solderMaskMargin={0.2}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="-5mm"
              pcbY="3.5mm"
              text="+0.2mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="-5mm"
              pcbY="-2mm"
              shape="circle"
              outerDiameter={1.5}
              holeDiameter={0.8}
              coveredWithSolderMask={true}
              solderMaskMargin={-0.1}
            />
            <silkscreentext
              pcbX="-5mm"
              pcbY="-3.5mm"
              text="-0.1mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <platedhole
              portHints={["pin3"]}
              pcbX="0mm"
              pcbY="2mm"
              shape="pill"
              outerWidth={2}
              outerHeight={1}
              holeWidth={1.5}
              holeHeight={0.7}
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
            <platedhole
              portHints={["pin4"]}
              pcbX="0mm"
              pcbY="-2mm"
              shape="pill"
              outerWidth={2}
              outerHeight={1}
              holeWidth={1.5}
              holeHeight={0.7}
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
            <platedhole
              portHints={["pin5"]}
              pcbX="5mm"
              pcbY="2mm"
              shape="circular_hole_with_rect_pad"
              holeDiameter={0.8}
              rectPadWidth={1.8}
              rectPadHeight={1.2}
              solderMaskMargin={0.25}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="5mm"
              pcbY="3.3mm"
              text="+0.25mm"
              fontSize="0.4mm"
              anchorAlignment="center"
            />
            <platedhole
              portHints={["pin6"]}
              pcbX="5mm"
              pcbY="-2mm"
              shape="circular_hole_with_rect_pad"
              holeDiameter={0.8}
              rectPadWidth={1.8}
              rectPadHeight={1.2}
              solderMaskMargin={-0.15}
              coveredWithSolderMask={true}
            />
            <silkscreentext
              pcbX="5mm"
              pcbY="-3.3mm"
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

  const circuitJson = circuit.getCircuitJson()
  const warnings = circuitJson.filter(
    (e) => e.type === "source_property_ignored_warning",
  )
  expect(warnings).toHaveLength(6)
  for (const warning of warnings) {
    expect(warning.message).toContain(
      "solderMaskMargin is set but coveredWithSolderMask is true",
    )
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
