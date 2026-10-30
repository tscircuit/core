import { expect, test } from "bun:test"
import { Circuit, assembly, getAssemblyExplosion } from "lib"
import { any_circuit_element } from "circuit-json"

test("unsupported or invalid geometry produces incomplete coverage without hiding known collisions", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="PARTIAL">
      <assembly.part
        name="MOVER"
        cadModel={{ jscad: { type: "cube", size: 2 } }}
      />
      <assembly.part
        name="OBSTACLE"
        cadModel={{
          jscad: { type: "cube", size: 2 },
          positionOffset: { x: 5, y: 0, z: 0 },
        }}
      />
      <assembly.part
        name="EXTERNAL"
        modelUrl="https://example.com/not-fetched.glb"
      />
      <assembly.part
        name="INVALID"
        cadModel={{ jscad: { type: "cube", size: -1 } }}
      />
      <assembly.explosion.stage name="slide">
        <assembly.explosion.move targetRef="MOVER" offX={10} />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_explosion_collision_error.list()).toHaveLength(1)
  const warnings = circuit.db.cad_explosion_collision_check_warning.list()
  expect(warnings.map((warning) => warning.reason).sort()).toEqual([
    "invalid_geometry",
    "unsupported_geometry",
  ])
  for (const warning of warnings)
    expect(any_circuit_element.parse(warning)).toEqual(warning)
  expect(
    warnings.find((warning) => warning.reason === "unsupported_geometry")!
      .cad_component_ids,
  ).toEqual([circuit.selectOne(".EXTERNAL")!.cad_component_id!])
  expect(
    warnings.find((warning) => warning.reason === "invalid_geometry")!
      .cad_component_ids,
  ).toEqual([circuit.selectOne(".INVALID")!.cad_component_id!])
  expect(getAssemblyExplosion(circuit).collisionCheckStatus).toBe("incomplete")
})
