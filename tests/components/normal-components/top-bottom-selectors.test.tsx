import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ensure top/bottom selectors adapt to schRotation

test("resistor top/bottom selectors rotate with schRotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" schRotation={90} />
    </board>,
  )

  circuit.render()

  const resistor = circuit.selectOne("resistor")!
  const topPort = resistor.portMap.top
  const bottomPort = resistor.portMap.bottom

  expect(topPort._parsedProps.pinNumber).toBe(2)
  expect(bottomPort._parsedProps.pinNumber).toBe(1)
})
