import { test, expect, spyOn } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { length } from "circuit-json"
import * as calc from "calculate-packing"

// Ensure pcbMarginY is forwarded to calculate-packing via chipMarginsMap

test("pcbPack forwards component pcbMargin to calculate-packing", () => {
  const { circuit } = getTestFixture()
  let captured: any = null
  const original = calc.convertCircuitJsonToPackOutput
  const spy = spyOn(calc, "convertCircuitJsonToPackOutput")
  spy.mockImplementation((cj: any, opts: any) => {
    captured = opts
    return original(cj, opts)
  })

  circuit.add(
    <board pcbPack pcbGap="0mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbMarginY="3mm" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()
  spy.mockRestore()

  expect(captured?.chipMarginsMap).toBeDefined()
  expect(Object.keys(captured.chipMarginsMap)).toHaveLength(1)
  const margin = Object.values<any>(captured.chipMarginsMap)[0]
  expect(margin).toEqual({
    left: 0,
    right: 0,
    top: length.parse("3mm"),
    bottom: length.parse("3mm"),
  })
})
