import { expect, test } from "bun:test"
import { assembly } from "lib"
import { convertCircuitJsonTo3D } from "circuit-json-to-gltf"
import { parseCableString } from "@tscircuit/cableprinter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"

test("inferred JST pin 1 sides follow emitted pins across rotations and PCB layers", async () => {
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
          const pin1 =
            end === "A"
              ? cable.from_connector_pin1_position
              : cable.to_connector_pin1_position
          expect(pin1).toBeDefined()
          const tipForPosition =
            end === "A" ? cable.path[0]! : cable.path.at(-1)!
          const adjacent = end === "A" ? cable.path[1]! : cable.path.at(-2)!
          const axial = [
            adjacent.x - tipForPosition.x,
            adjacent.y - tipForPosition.y,
            adjacent.z - tipForPosition.z,
          ]
          const axialLength = Math.hypot(...axial)
          const offset = [
            pin1!.x - tipForPosition.x,
            pin1!.y - tipForPosition.y,
            pin1!.z - tipForPosition.z,
          ]
          expect((offset[0]! * dx + offset[1]! * dy) / length).toBeCloseTo(
            -length / 2,
            5,
          )
          expect(
            offset.reduce(
              (sum, value, axis) => sum + (value * axial[axis]!) / axialLength,
              0,
            ),
          ).toBeCloseTo(
            -parseCableString(cable.cableprinter_string).connectorA.bodyDepth,
            5,
          )
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
          const wire = scene.boxes.find(
            (box) => box.label === "CABLE / wire-1",
          )!
          const tip = end === "A" ? cable.path[0]! : cable.path.at(-1)!
          const cap = wire
            .mesh!.triangles.flatMap((triangle) => triangle.vertices)
            .filter(
              (vertex) =>
                Math.abs(vertex.y - tip.z) < 1e-6 &&
                Math.hypot(vertex.x - tip.x, vertex.z - tip.y) <
                  parseCableString(cable.cableprinter_string).connectorA
                    .bodyWidth /
                    2 +
                    1,
            )
          // Wire 1 must land toward the actual emitted pin 1, not merely
          // anywhere on the same unsigned width axis.
          const projectedCap = cap.map(
            (vertex) => (vertex.x * dx + vertex.z * dy) / length,
          )
          const capCenter =
            (Math.max(...projectedCap) + Math.min(...projectedCap)) / 2
          const plugCenter = (tip.x * dx + tip.y * dy) / length
          expect(capCenter - plugCenter).toBeCloseTo(-length / 2, 5)
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
