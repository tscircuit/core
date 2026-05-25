import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smtpad with scientific notation pcb coordinates does not emit property errors", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              pcbX="-1.1368683772161603e-13mm"
              pcbY="0mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors.length).toBe(0)

  const smtPads = circuit.db.pcb_smtpad.list()
  expect(smtPads.length).toBe(1)
  expect(smtPads[0]?.x).toBeCloseTo(-1.1368683772161603e-13)
})
