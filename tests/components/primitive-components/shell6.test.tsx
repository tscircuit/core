import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("shell rejects duplicate effective unit reference designators", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true

  circuit.add(
    <board>
      <shell name="RN1">
        <resistor
          unitId="A"
          refdesOverride="R_SHARED"
          resistance="1k"
          pinMapping={{ pin1: "1", pin2: "2" }}
        />
        <resistor
          unitId="B"
          refdesOverride="R_SHARED"
          resistance="2k"
          pinMapping={{ pin1: "3", pin2: "4" }}
        />
      </shell>
    </board>,
  )

  expect(() => circuit.render()).toThrow(
    '<shell name="RN1"> has duplicate unit refdes or alias "R_SHARED"',
  )
})
