import { expect, test } from "bun:test"
import {
  Circuit,
  assembly,
  getAssemblyExplosion,
  getCircuitJsonAssemblyExplosion,
} from "lib"

test("serialized movements preserve resolved local frames and nested physical assemblies", async () => {
  for (const normalDirection of ["z+", "z-", "y+", "y-"] as const) {
    const circuit = new Circuit()
    circuit.add(
      <assembly.device name="D">
        <assembly.part
          name="BASE"
          cadModel={{ jscad: { type: "cube", size: 4 } }}
        >
          <assembly.referencesurface
            name="face"
            plane={normalDirection[0] === "z" ? "xy" : "xz"}
            normalDirection={normalDirection}
          />
        </assembly.part>
        <assembly.part
          name="CARRIER"
          mountedTo="BASE.face"
          mountFace="back"
          cadModel={{ jscad: { type: "cube", size: 2 } }}
        >
          <assembly.referencesurface name="back" normalDirection="z-" />
          <assembly.subassembly name="MODULE">
            <assembly.part
              name="MARKER"
              cadModel={{ jscad: { type: "cube", size: 1 } }}
            />
            <assembly.explosion.stage name="move">
              <assembly.explosion.move
                targetRef="MARKER"
                offX="5mm"
                offY="7mm"
                offZ="11mm"
              />
            </assembly.explosion.stage>
          </assembly.subassembly>
        </assembly.part>
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    const json = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
    for (const stageProgress of [0, 0.3, 1]) {
      const options = {
        throughStageRef: "D.CARRIER.MODULE.move",
        stageProgress,
      }
      const actual = getCircuitJsonAssemblyExplosion(json, options).circuitJson
      const expected = getAssemblyExplosion(circuit, options).circuitJson
      for (const record of actual) {
        if (
          record.type !== "cad_component" &&
          record.type !== "cad_reference_surface"
        )
          continue
        const idKey =
          record.type === "cad_component"
            ? "cad_component_id"
            : "cad_reference_surface_id"
        const prior = expected.find(
          (candidate: any) => candidate[idKey] === (record as any)[idKey],
        ) as any
        const key = record.type === "cad_component" ? "position" : "center"
        for (const axis of ["x", "y", "z"])
          expect((record as any)[key][axis]).toBeCloseTo(prior[key][axis], 5)
      }
    }
  }
})
