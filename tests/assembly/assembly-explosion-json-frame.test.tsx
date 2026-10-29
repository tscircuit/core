import { poppyglExplosionLines } from "./fixtures/poppygl-explosion-lines"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { expect, test } from "bun:test"
import {
  Circuit,
  assembly,
  jscad,
  getAssemblyExplosion,
  getCircuitJsonAssemblyExplosion,
} from "lib"

test("serialized movements preserve resolved local frames and nested physical assemblies", async () => {
  const panels: Parameters<typeof expectAssemblySnapshot>[1]["panels"] = []
  for (const normalDirection of ["z+", "z-", "y+", "y-"] as const) {
    const circuit = new Circuit()
    circuit.add(
      <assembly.device name="D">
        <assembly.part
          name="BASE"
          cadModel={{
            jscad: {
              type: "colorize",
              color: [0.3, 0.4, 0.5],
              shape: { type: "cuboid", size: [5, 4, 2] },
            },
          }}
        >
          <assembly.referencesurface
            name="face"
            plane={normalDirection[0] === "z" ? "xy" : "xz"}
            normalDirection={normalDirection}
          />
        </assembly.part>
        <assembly.printedpart
          name="CARRIER"
          mountedTo="BASE.face"
          mountFace="back"
          color="#3283b5"
          jscad={<jscad.cube size={2} />}
        >
          <assembly.referencesurface name="back" normalDirection="z-" />
          <assembly.subassembly name="MODULE">
            <assembly.part
              name="MARKER"
              cadModel={{
                jscad: {
                  type: "colorize",
                  color: [0.95, 0.65, 0.2],
                  shape: { type: "cuboid", size: [2, 1, 3] },
                },
              }}
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
        </assembly.printedpart>
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
    panels.push({
      title: `Mount normal ${normalDirection}: local XYZ movement`,
      code: `<assembly.referencesurface
  normalDirection="${normalDirection}" />
<assembly.explosion.move
  targetRef="MARKER"
  offX="5mm" offY="7mm" offZ="11mm" />`,
      annotation:
        "Gray base / blue carrier stay fixed. Amber marker follows the resolved local frame.",
      circuit: json,
      showReferenceSurfaces: true,
      renderOptions: {
        camPos: [-26, 22, 27],
        poppygl: {
          lookAt: [0, 0, 0],
          explosionLines: poppyglExplosionLines(
            getCircuitJsonAssemblyExplosion(json),
          ),
        },
        gltf: { explosion: {} },
      },
    })
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Serialized directions across upright, inverted and tilted mounts",
    panels,
    columns: 2,
    font: "alphabet",
  })
})
