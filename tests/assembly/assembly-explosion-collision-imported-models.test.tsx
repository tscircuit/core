import { expect, test } from "bun:test"
import {
  Circuit,
  assembly,
  getAssemblyExplosion,
  checkCircuitJsonAssemblyExplosionCollisions,
} from "lib"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import { loadRp2040ExplosionFixture } from "./fixtures/rp2040-explosion/load-fixture"

test("TSX GLB motor and OBJ M3 bolt use real holes and report entering the blind-hole floor", async () => {
  const fixture = await loadRp2040ExplosionFixture()
  const motor = fixture.find(
    (r) => r.type === "cad_component" && r.model_glb_url,
  )!
  const boltSource = fixture.find(
    (r) => r.type === "source_component" && r.name === "bolt1",
  )!
  if (motor.type !== "cad_component" || boltSource.type !== "source_component")
    throw Error("Missing real fixture models")
  const bolt = fixture.find(
    (r) =>
      r.type === "cad_component" &&
      r.source_component_id === boltSource.source_component_id,
  )!
  if (bolt.type !== "cad_component") throw Error("Missing bolt")
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="IMPORTED">
      <assembly.part
        name="NEMA17"
        cadModel={{
          glbUrl: motor.model_glb_url!,
          modelOriginPosition: { x: 0, y: 0, z: 0 },
        }}
      />
      <assembly.part
        name="M3"
        cadModel={{
          objUrl: bolt.model_obj_url!,
          modelOriginPosition: { x: 0, y: 0, z: 0 },
          positionOffset: { x: 15.5, y: 15.5, z: 42 },
        }}
      />
      <assembly.explosion.stage name="insert">
        <assembly.explosion.move targetRef="M3" offZ={-6.9} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("checked")
  expect(circuit.db.cad_explosion_collision_check_warning.list()).toEqual([])
  expect(circuit.db.cad_explosion_collision_error.list()).toEqual([])
  const move = circuit.selectOne(".insert")!
    .children[0] as AssemblyExplosionMove
  move.setProps({ ...move.props, offZ: -12 })
  await circuit.renderUntilSettled()
  const errors = circuit.db.cad_explosion_collision_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toContain('moves "M3" through "NEMA17"')
  expect(errors[0].swept_intersection_volume_mm3).toBeGreaterThan(2)
  // Rerendering/getters must not duplicate an async imported-model diagnostic.
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toEqual(errors)
  // A legacy alternate format must not hide a supported model that the shared
  // renderer loads first. No request to the unsupported URL should be needed.
  const withAlternateFormats = circuit
    .getCircuitJson()
    .map((record) =>
      record.type === "cad_component"
        ? { ...record, model_wrl_url: "https://example.com/unused.wrl" }
        : record,
    )
  const alternateCheck =
    await checkCircuitJsonAssemblyExplosionCollisions(withAlternateFormats)
  expect(alternateCheck.status).toBe("checked")
  expect(alternateCheck.errors).toHaveLength(1)
})
