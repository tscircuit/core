import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Non-subcircuit group offset schematic with resistor", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <group name="group1" schX={1}>
      <resistor name="R1" footprint="0402" resistance={1000} />
    </group>,
  )

  circuit.render()

  const resistor = circuit.selectOne("resistor")!

  const pos = resistor._getGlobalSchematicPositionBeforeLayout()

  expect(pos).toMatchInlineSnapshot(`
{
  "x": 1,
  "y": 0,
}
`)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("Non-subcircuit group offset schematic with resistor and capacitor connected by trace", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <group name="group1" schX={3} schY={3}>
      <resistor name="R1" footprint="0402" resistance={1000} />
      <capacitor name="C1" footprint="0402" capacitance={1000} schX={3} />
      <trace from=".R1 > .2" to=".C1 > .1" />
    </group>,
  )

  circuit.render()

  const resistor = circuit.selectOne("resistor")!
  const capacitor = circuit.selectOne("capacitor")!

  expect(
    resistor._getGlobalSchematicPositionBeforeLayout(),
  ).toMatchInlineSnapshot(`
{
  "x": 3,
  "y": 3,
}
`)

  expect(
    capacitor._getGlobalSchematicPositionBeforeLayout(),
  ).toMatchInlineSnapshot(`
{
  "x": 6,
  "y": 3,
}
`)
})
