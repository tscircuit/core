import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render may only return PCB primitives: a component is reported, not placed", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="16mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <pcbpostroutingstep
        name="extra part"
        render={() => <resistor name="R9" resistance="1k" footprint="0402" />}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const cj = circuit.getCircuitJson()
  expect(
    cj.some((e) => e.type === "source_component" && (e as any).name === "R9"),
  ).toBe(false)
  expect(
    cj
      .filter((e) => e.type === "pcb_autorouting_error")
      .map((e: any) => e.message),
  ).toEqual([
    '<pcbpostroutingstep name="extra part" /> failed: pcbpostroutingstep: render may only return PCB primitives (pads, holes, silkscreen, notes...), not <resistor>',
  ])
})
