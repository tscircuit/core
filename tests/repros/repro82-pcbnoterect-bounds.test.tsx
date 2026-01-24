import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro82: pcb note elements should not affect component bounds for DRC", async () => {
  const { circuit } = getTestFixture()

  // Create a board with chips that have:
  // - Small physical footprints (SMT pad, plated holes)
  // - Large pcbnoterect/pcbnotetext annotations that extend beyond the board
  // These annotations should NOT affect bounds or cause DRC errors
  circuit.add(
    <board width="10mm" height="6mm">
      {/* Chip with pcbnoterect larger than physical footprint */}
      <chip
        name="U1"
        pcbX={-3}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["1"]}
            />
            {/* Large annotation rectangle - extends beyond board */}
            <pcbnoterect
              pcbX={0}
              pcbY={0}
              width="5mm"
              height="5mm"
              strokeWidth={0.1}
              color="blue"
            />
          </footprint>
        }
      />
      {/* Chip with pcbnotetext */}
      <chip
        name="U2"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["1"]}
            />
            {/* Text annotation - should not affect bounds */}
            <pcbnotetext pcbX={0} pcbY={2} text="Large Label" fontSize={1} />
          </footprint>
        }
      />
      {/* Chip with plated hole and note rect */}
      <chip
        name="U3"
        pcbX={3}
        pcbY={0}
        footprint={
          <footprint>
            <platedhole
              pcbX={0}
              pcbY={0}
              holeDiameter="1mm"
              outerDiameter="1.6mm"
              shape="circle"
              portHints={["1"]}
            />
            <pcbnoterect
              pcbX={0}
              pcbY={0}
              width="2mm"
              height="2mm"
              strokeWidth={0.05}
              color="gold"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  // Get pcb_components sorted by x position (U1 at -3, U2 at 0, U3 at 3)
  const pcbComponents = circuitJson
    .filter(
      (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
        elm.type === "pcb_component",
    )
    .sort((a, b) => a.center.x - b.center.x)

  expect(pcbComponents.length).toBe(3)

  // U1 (leftmost): bounds should be 1mm (smtpad), not 5mm (pcbnoterect)
  expect(pcbComponents[0].width).toBeCloseTo(1, 1)
  expect(pcbComponents[0].height).toBeCloseTo(1, 1)

  // U2 (middle): bounds should be 1mm (smtpad), not affected by pcbnotetext
  expect(pcbComponents[1].width).toBeCloseTo(1, 1)
  expect(pcbComponents[1].height).toBeCloseTo(1, 1)

  // U3 (rightmost): bounds should be 1.6mm (plated hole outer), not 2mm (pcbnoterect)
  expect(pcbComponents[2].width).toBeCloseTo(1.6, 1)
  expect(pcbComponents[2].height).toBeCloseTo(1.6, 1)

  // No DRC errors - physical footprints are inside the board
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toEqual([])
})
