import { expect, test } from "bun:test"
import { loadCadComponentMesh } from "circuit-json-to-gltf"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { expectAssemblySnapshot } from "tests/assembly/fixtures/expect-assembly-snapshot"

test("generated footprint models keep their leads on the holes across rotations and layers", async () => {
  const panels = []
  for (const footprint of ["to92l", "pinrow4"]) {
    for (const layer of ["top", "bottom"] as const) {
      for (const angle of [0, 90, 180, 270]) {
        const { circuit } = getTestFixture()
        circuit.add(
          <board
            width={16}
            height={14}
            thickness={1.6}
            pcbX={12}
            pcbY={-5}
            routingDisabled
          >
            <chip
              name="U1"
              footprint={footprint}
              pcbX={1}
              pcbY={-2}
              pcbRotation={angle}
              layer={layer}
            />
          </board>,
        )
        await circuit.renderUntilSettled()
        const cad = circuit.db.cad_component.list()[0]!
        const pcb = circuit.db.pcb_component.get(cad.pcb_component_id!)!
        const mesh = await loadCadComponentMesh(cad, { pcbComponent: pcb })
        // Measure emitted lead ends in right-handed circuit-world mm, +Z up.
        // A bottom mounting reverses the axial projection. TO-92L's pin 1
        // is at the authored origin; its lead pattern is not centered there.
        // Derive the expected positions from the actual emitted PCB holes.
        const sign = layer === "top" ? 1 : -1
        const vertices = Array.from(
          { length: mesh.positions.length / 3 },
          (_, i) => ({
            x: mesh.positions[3 * i]!,
            y: mesh.positions[3 * i + 1]!,
            z: mesh.positions[3 * i + 2]!,
          }),
        )
        const end = Math.min(...vertices.map((point) => sign * point.z))
        const tips = vertices.filter(
          (point) => Math.abs(sign * point.z - end) < 1e-5,
        )
        const holes = circuit.db.pcb_plated_hole
          .list()
          .filter((hole) => hole.pcb_component_id === cad.pcb_component_id)
        expect(holes).toHaveLength(footprint === "to92l" ? 3 : 4)
        for (const hole of holes) {
          const lead = tips.filter(
            (point) => Math.hypot(point.x - hole.x, point.y - hole.y) < 0.6,
          )
          expect(lead.length).toBeGreaterThan(0)
          for (const axis of ["x", "y"] as const) {
            const coordinates = lead.map((point) => point[axis])
            expect(
              (Math.min(...coordinates) + Math.max(...coordinates)) / 2,
            ).toBeCloseTo(hole[axis], 5)
          }
        }
        if (
          (footprint === "to92l" && angle === (layer === "top" ? 0 : 90)) ||
          (footprint === "pinrow4" && angle === (layer === "top" ? 180 : 270))
        ) {
          panels.push({
            title: `${footprint} / ${layer} / ${angle} degrees`,
            code: `<board width={16} height={14}\n  pcbX={12} pcbY={-5}>\n  <chip name="U1"\n    footprint="${footprint}"\n    pcbX={1} pcbY={-2}\n    pcbRotation={${angle}}\n    layer="${layer}" />\n</board>`,
            annotation:
              footprint === "to92l"
                ? "Pin 1 defines the authored origin; the offset lead pattern stays on its holes."
                : "Centered header control: the same generic origin rule preserves every pin.",
            circuit,
            renderOptions: {
              poppygl: {
                camPos: [-32, layer === "top" ? 25 : -25, 22] as [
                  number,
                  number,
                  number,
                ],
                lookAt: [-13, 0, -7] as [number, number, number],
                fov: 30,
              },
            },
          })
        }
      }
    }
  }
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Generated footprint models / authored origin, real leads and PCB holes",
    font: "alphabet",
    layout: "model_focus",
    columns: 2,
    panels,
  })
}, 30_000)
