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
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
