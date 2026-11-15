import { expect, test } from "bun:test"
import { assembly, Circuit } from "lib"

test("render warns when a printed part has no checkable collision mesh", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="strip">
      <board width={150} height={14} thickness={1.6} routingDisabled />
      <assembly.printedpart name="BOSS" modelUrl="./boss.wrl" />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.cad_assembly_collision_error.list()).toEqual([])
  const warnings = circuit.db.cad_assembly_collision_check_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].reason).toBe("invalid_geometry")
  expect(warnings[0].cad_component_ids).toEqual([
    circuit.db.cad_component.list()[0].cad_component_id,
  ])
})
