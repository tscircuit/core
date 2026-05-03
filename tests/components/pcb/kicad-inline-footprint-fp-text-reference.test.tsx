import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Regression test for https://github.com/tscircuit/core/issues/2045
 *
 * Components using inline <footprint> definitions were exported to KiCad PCB
 * without an fp_text reference element because no pcb_silkscreen_text with
 * the component name was generated. This test verifies that a fallback
 * silkscreen text (reference designator) is automatically injected when an
 * inline footprint contains no explicit silkscreen text.
 */
test("inline footprint gets a fallback silkscreen reference text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
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
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()

  // There should be at least one silkscreen text with the component name
  const refTexts = silkscreenTexts.filter((t) => t.text === "U1")
  expect(refTexts.length).toBeGreaterThan(0)
})

test("inline footprint with explicit silkscreen text does not get a duplicate", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U2"
        pcbX={0}
        pcbY={0}
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
            <silkscreentext text="U2" pcbX={0} pcbY={1} anchorAlignment="center" />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const silkscreenTexts = circuit.db.pcb_silkscreen_text.list()
  const refTexts = silkscreenTexts.filter((t) => t.text === "U2")

  // Should only have the explicit one, not a duplicate
  expect(refTexts.length).toBe(1)
})
