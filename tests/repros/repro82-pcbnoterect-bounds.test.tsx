import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro82: pcbnoterect should not affect component bounds for DRC", async () => {
  const { circuit } = getTestFixture()

  // Create a board with a chip that has:
  // - A small physical footprint (SMT pad)
  // - A large pcbnoterect annotation that extends beyond the board
  circuit.add(
    <board width="4mm" height="4mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {/* Small physical footprint - fully inside board */}
            <smtpad
              pcbX={0}
              pcbY={0}
              shape="rect"
              width="1mm"
              height="1mm"
              portHints={["1"]}
            />
            {/* Large annotation rectangle - extends beyond board */}
            {/* This should NOT cause DRC errors */}
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
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  // Get the pcb_component
  const pcbComponents = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
      elm.type === "pcb_component",
  )
  expect(pcbComponents.length).toBe(1)

  const pcbComponent = pcbComponents[0]

  // The component bounds should be based on the SMT pad (1mm x 1mm),
  // NOT the pcbnoterect (5mm x 5mm)
  expect(pcbComponent.width).toBeCloseTo(1, 1)
  expect(pcbComponent.height).toBeCloseTo(1, 1)

  // There should be no DRC errors - the physical footprint is inside the board
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toEqual([])
})

test("repro82: pcbnotetext should not affect component bounds for DRC", async () => {
  const { circuit } = getTestFixture()

  // Create a board with a chip that has a pcbnotetext
  circuit.add(
    <board width="4mm" height="4mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            {/* Small physical footprint */}
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
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbComponents = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
      elm.type === "pcb_component",
  )
  expect(pcbComponents.length).toBe(1)

  const pcbComponent = pcbComponents[0]

  // Bounds should only include the SMT pad, not the text
  expect(pcbComponent.width).toBeCloseTo(1, 1)
  expect(pcbComponent.height).toBeCloseTo(1, 1)

  // No DRC errors expected
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toEqual([])
})

test("repro82: panel with multiple boards should not have false DRC errors from note elements", async () => {
  const { circuit } = getTestFixture()

  // Components at board edges with note rectangles that extend slightly beyond
  circuit.add(
    <panel width="20mm" height="10mm" layoutMode="none">
      <board width="8mm" height="4mm" pcbX={4} pcbY={2}>
        <chip
          name="U1"
          pcbX={-3}
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
              {/* Bounding box annotation - slightly larger than hole */}
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
        <chip
          name="U2"
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
      </board>
      <board width="8mm" height="4mm" pcbX={14} pcbY={2}>
        <chip
          name="U3"
          pcbX={-3}
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
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  // Verify component bounds are based on plated holes (1.6mm), not note rects (2mm)
  const pcbComponents = circuitJson.filter(
    (elm): elm is Extract<typeof elm, { type: "pcb_component" }> =>
      elm.type === "pcb_component",
  )

  for (const comp of pcbComponents) {
    expect(comp.width).toBeCloseTo(1.6, 1)
    expect(comp.height).toBeCloseTo(1.6, 1)
  }

  // No DRC errors - physical footprints are inside their boards
  const errors = circuitJson.filter((elm) => elm.type.includes("error"))
  expect(errors).toEqual([])
})
