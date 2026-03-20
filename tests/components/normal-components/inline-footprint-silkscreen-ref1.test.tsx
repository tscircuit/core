import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with inline footprint should have silkscreen reference designator text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U_LC1"
        footprint={
          <footprint>
            <smtpad
              pcbX={0}
              pcbY={-1.5}
              width="0.5mm"
              height="0.8mm"
              shape="rect"
              portHints={["1"]}
            />
            <smtpad
              pcbX={0}
              pcbY={1.5}
              width="0.5mm"
              height="0.8mm"
              shape="rect"
              portHints={["2"]}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Verify that a pcb_silkscreen_text element exists with the component name
  const silkscreenTexts = circuitJson.filter(
    (e: any) => e.type === "pcb_silkscreen_text",
  )

  expect(silkscreenTexts.length).toBeGreaterThanOrEqual(1)

  const refText = silkscreenTexts.find((e: any) => e.text === "U_LC1")
  expect(refText).toBeDefined()
  expect((refText as any).text).toBe("U_LC1")
})
