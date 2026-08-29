import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb view shows a plated hole drill through an overlapping smtpad", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="8mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint={
          <footprint>
            <smtpad
              portHints={["1", "pin1"]}
              pcbX="-0.5mm"
              shape="rect"
              width="2.8mm"
              height="1.6mm"
              rectBorderRadius="0.4mm"
              layer="top"
            />
            <platedhole
              portHints={["1", "pin1"]}
              shape="circular_hole_with_rect_pad"
              holeDiameter="0.9mm"
              rectPadWidth="1.8mm"
              rectPadHeight="1.6mm"
              rectBorderRadius="0.4mm"
              holeOffsetX="-0.1mm"
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="Expected: circular drill is visible through the overlapping SMT pad"
        pcbY="2.5mm"
        fontSize="0.35mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
