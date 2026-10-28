import { expect, test } from "bun:test"
import {
  Circuit,
  assembly,
  getAssemblyExplosion,
  getCircuitJsonAssemblyExplosion,
} from "lib"
import type { CadComponent, CadExplosionMove } from "circuit-json"

test("TSX exports ordered movements and whole-stage targets that survive JSON-only playback", async () => {
  const circuit = new Circuit()
  circuit.add(
    <assembly.device name="DEVICE">
      <assembly.part name="COVER">
        <assembly.part
          name="SHELL"
          cadModel={{ jscad: { type: "cube", size: 4 } }}
        />
        <assembly.part
          name="WINDOW"
          cadModel={{ jscad: { type: "cube", size: 2 } }}
        />
        <assembly.referencesurface name="origin" />
      </assembly.part>
      <assembly.explosion.stage name="lift">
        <assembly.explosion.move targetRef="COVER" offZ="10mm" />
        <assembly.explosion.move targetRef="COVER.WINDOW" offZ="4mm" />
      </assembly.explosion.stage>
      <assembly.explosion.stage name="park" prevStageRef="lift">
        <assembly.explosion.move
          targetRefs={["lift", "COVER.WINDOW"]}
          offX="20mm"
        />
      </assembly.explosion.stage>
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  const assembled = circuit.getCircuitJson()
  expect(circuit.getCircuitJson()).toEqual(assembled)
  const json = JSON.parse(JSON.stringify(assembled)).reverse()
  const stages = json.filter(
    (record: any) => record.type === "cad_explosion_stage",
  )
  expect(stages).toHaveLength(2)
  expect(stages[0].cad_component_ids).toHaveLength(2)
  expect(stages[0].cad_reference_surface_ids).toHaveLength(1)
  const moves = json.filter(
    (record: any) => record.type === "cad_explosion_move",
  ) as CadExplosionMove[]
  expect(moves).toHaveLength(3)
  expect(moves[0].targets[0].type).toBe("cad_explosion_stage")
  const original = structuredClone(json)
  const full = getCircuitJsonAssemblyExplosion(json)
  const halfway = getCircuitJsonAssemblyExplosion(json, {
    throughStageRef: "DEVICE.park",
    stageProgress: 0.5,
  })
  const firstQuarter = getCircuitJsonAssemblyExplosion(json, {
    throughStageRef: "DEVICE.lift",
    stageProgress: 0.25,
  })
  for (const component of assembled.filter(
    (record): record is CadComponent => record.type === "cad_component",
  )) {
    const source = assembled.find(
      (record) =>
        record.type === "source_component" &&
        record.source_component_id === component.source_component_id,
    ) as any
    const position = (view: typeof full) =>
      (
        view.circuitJson.find(
          (record) =>
            record.type === "cad_component" &&
            record.cad_component_id === component.cad_component_id,
        ) as CadComponent
      ).position
    expect(position(full)).toEqual({
      x: component.position.x + 20,
      y: component.position.y,
      z: component.position.z + (source.name === "WINDOW" ? 14 : 10),
    })
    expect(position(halfway).x).toBe(component.position.x + 10)
    expect(position(firstQuarter).z).toBe(component.position.z + 5)
  }
  const surface = full.circuitJson.find(
    (record) => record.type === "cad_reference_surface",
  ) as any
  expect(surface.center).toEqual({ x: 20, y: 0, z: 10 })
  expect(getAssemblyExplosion(circuit).circuitJson).toEqual(
    getCircuitJsonAssemblyExplosion(assembled).circuitJson,
  )
  expect(getCircuitJsonAssemblyExplosion(json).circuitJson).toEqual(
    full.circuitJson,
  )
  expect(json).toEqual(original)
})
