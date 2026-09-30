import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"
import { EnclosureFdmBox } from "lib/components/primitive-components/EnclosureFdmBox"

test("a new assembly DRC pass replaces stale diagnostics", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<EnclosureApertureDrcFixture />)
  await circuit.renderUntilSettled()
  const collisionError = circuit.db.cad_collision_error.list()[0]!
  expect(collisionError).toBeDefined()
  const part = circuit.db.cad_component.get(collisionError.cad_component_id)!
  circuit.db.cad_component.update(part.cad_component_id, {
    position: { x: 100, y: 0, z: 0 },
  })
  const enclosure = circuit
    .firstChild!.getDescendants()
    .find(
      (component): component is EnclosureFdmBox =>
        component instanceof EnclosureFdmBox,
    )!
  enclosure._markDirty("AssemblyDesignRuleChecks")
  circuit.render()
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_collision_error.list()).toHaveLength(0)
})
