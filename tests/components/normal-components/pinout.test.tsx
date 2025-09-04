import { it, expect } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { Pinout } from "lib/components/normal-components/Pinout"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

it("renders a Pinout component", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="10mm" height="10mm">
      <pinout name="U1" footprint="soic8" />
    </board>,
  )
  circuit.render()
  const pinout = circuit.selectOne("pinout") as Pinout
  expect(pinout).not.toBeNull()
  const sourceComponent = circuit.db.source_component.get(
    pinout.source_component_id!,
  )
  expect(sourceComponent?.ftype).toBe("simple_pinout")
  expect(
    convertCircuitJsonToSchematicSvg(circuit.getCircuitJson()),
  ).toMatchSvgSnapshot(import.meta.path)
})
