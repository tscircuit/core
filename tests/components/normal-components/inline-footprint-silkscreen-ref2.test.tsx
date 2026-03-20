import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with inline footprint that already has silkscreen text should not duplicate it", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U2"
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
            <silkscreentext text="U2" pcbX={0} pcbY={-3} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Verify that only one silkscreen text exists (no duplicate)
  const silkscreenTexts = circuitJson.filter(
    (e: any) => e.type === "pcb_silkscreen_text" && e.text === "U2",
  )

  expect(silkscreenTexts.length).toBe(1)
})
