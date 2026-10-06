import { expect, test } from "bun:test"
import { assembly } from "lib"
import { convertCircuitJsonTo3D } from "circuit-json-to-gltf"
import { parseCableString } from "@tscircuit/cableprinter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("inferred JST plug width directions follow emitted pins across rotations and PCB layers", async () => {
  const panels = []
  for (const standard of ["jst_ph", "jst_sh"] as const) {
    for (const layer of ["top", "bottom"] as const) {
      for (const angle of [0, 35, 90, 180, 270]) {
        const { circuit } = getTestFixture()
        circuit.add(
          <assembly.device>
            <board width={50} height={25} routingDisabled>
              <connector
                name="J1"
                standard={standard}
                pinCount={6}
                footprint={standard === "jst_ph" ? "jst6_ph" : "jst6_sh"}
                pcbX={-15}
                pcbRotation={angle}
                layer={layer}
              />
              <connector
                name="J2"
                standard={standard}
                pinCount={6}
                footprint={standard === "jst_ph" ? "jst6_ph" : "jst6_sh"}
                pcbX={15}
                pcbRotation={angle + 90}
                layer={layer}
              />
            </board>
            <assembly.cable name="CABLE" from=".J1" to=".J2" />
          </assembly.device>,
        )
        await circuit.renderUntilSettled()
        const cable = circuit.db.cad_cable.list()[0]!
        const scene = await convertCircuitJsonTo3D(circuit.getCircuitJson(), {
          renderBoardTextures: false,
        })
        for (const [name, end] of [
          ["J1", "A"],
          ["J2", "B"],
        ] as const) {
          const connector = circuit.db.source_component
            .list()
            .find((source) => source.name === name)!
          const pinPosition = (pin: string) => {
            const sourcePort = circuit.db.source_port
              .list()
              .find(
                (port) =>
                  port.source_component_id === connector.source_component_id &&
                  port.port_hints?.includes(pin),
              )!
            return circuit.db.pcb_port
              .list()
              .find(
                (port) => port.source_port_id === sourcePort.source_port_id,
              )!
          }
          const first = pinPosition("pin1"),
            last = pinPosition("pin6")
          const dx = last.x - first.x,
            dy = last.y - first.y
          const length = Math.hypot(dx, dy)
          const housing = scene.boxes.find(
            (box) => box.label === `CABLE / ${end}-housing`,
          )!
          const projection = housing.mesh!.triangles.flatMap((triangle) =>
            triangle.vertices.map(
              (vertex) => (vertex.x * dx + vertex.z * dy) / length,
            ),
          )
          expect(Math.max(...projection) - Math.min(...projection)).toBeCloseTo(
            parseCableString(cable.cableprinter_string).connectorA.bodyWidth,
            5,
          )
        }
        if (standard === "jst_ph" && angle !== 35) {
          panels.push({
            title: `PH header / ${layer} layer / ${angle} degrees`,
            code: `<connector name="J1"
  standard="jst_ph" pinCount={6}
  footprint="jst6_ph" pcbX={-15}
  pcbRotation={${angle}} layer="${layer}" />
<connector name="J2"
  standard="jst_ph" pinCount={6}
  footprint="jst6_ph" pcbX={15}
  pcbRotation={${angle + 90}} layer="${layer}" />
<assembly.cable name="CABLE"
  from=".J1" to=".J2" />`,
            annotation:
              "Each plug aligns with its own header; the wire bundle twists between them automatically.",
            circuit,
            renderOptions: {
              poppygl: {
                camPos: [65, layer === "top" ? 65 : -65, 65] as [
                  number,
                  number,
                  number,
                ],
                lookAt: [0, 0, 0] as [number, number, number],
                fov: 40,
              },
            },
          })
        }
      }
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title: "Automatic connector roll / independent headers on both PCB layers",
    font: "alphabet",
    columns: 2,
    panels,
  })
}, 30_000)
