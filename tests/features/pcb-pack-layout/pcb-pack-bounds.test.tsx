import { test, expect, vi } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import * as cp from "calculate-packing"

test("pcbPack uses bounds when width and height are defined", () => {
  const packSpy = vi.spyOn(cp, "pack")
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack width="30mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const call = packSpy.mock.calls.find(
    ([input]) => input.components.length === 2,
  )
  expect(call?.[0].bounds).toEqual({
    minX: -15,
    minY: -10,
    maxX: 15,
    maxY: 10,
  })
})
