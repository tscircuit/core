import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"
import { EnclosureFdmBox } from "lib/components/primitive-components/EnclosureFdmBox"

test("assembly DRC updates and removal clean up diagnostics and enclosure associations", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<EnclosureApertureDrcFixture />)
  await circuit.renderUntilSettled()
  const collisionError = circuit.db.cad_collision_error.list()[0]!
  expect(collisionError).toBeDefined()
  const part = circuit.db.cad_component.get(
    collisionError.cad_component_ids[0]!,
  )!
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
  const metadata = circuit.db.cad_enclosure.get(enclosure.cad_enclosure_id!)!
  expect(metadata.cad_component_ids).toHaveLength(2)
  enclosure.parent!.remove(enclosure)
  // Run removal phases for the detached component.
  enclosure.runRenderCycle()
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_enclosure.list()).toHaveLength(0)
  for (const cadComponentId of metadata.cad_component_ids)
    expect(circuit.db.cad_component.get(cadComponentId)).toBeFalsy()
  expect(circuit.db.cad_collision_error.list()).toHaveLength(0)
})
