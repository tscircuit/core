import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { createErOled096ConnectorFootprint } from "./fixtures/er-oled096-1-3w"

test("nested CAD children and model props follow rotated top and bottom assembly frames", () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const pcbRotation of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      circuit.add(
        <assembly.device name="device">
          <assembly.subassembly name="outer" connectsTo=".J1">
            <assembly.cadassembly
              name="inner"
              cadModel={
                <cadassembly>
                  <cadmodel
                    modelUrl="https://example.com/a.glb"
                    pcbX={2}
                    pcbY={3}
                    pcbZ={4}
                  />
                </cadassembly>
              }
            >
              <cadmodel modelUrl="https://example.com/b.obj" pcbX={-2} />
            </assembly.cadassembly>
          </assembly.subassembly>
          <board width={30} height={30} thickness={1.6} routingDisabled>
            <connector
              name="J1"
              pinCount={30}
              pcbX={5}
              pcbY={6}
              layer={layer}
              pcbRotation={pcbRotation}
              cadModel={null}
              footprint={createErOled096ConnectorFootprint("from_top")}
            />
          </board>
          <assembly.subassembly
            name="separate"
            connectsTo=".inner"
            cadModel={{
              glbUrl: "https://example.com/c.glb",
              positionOffset: { x: 2, y: 3, z: 4 },
            }}
          />
        </assembly.device>,
      )
      circuit.render()
      const cad = circuit.db.cad_component.list()
      const a = cad.find((c) => c.model_glb_url?.endsWith("a.glb"))!
      const c = cad.find((c) => c.model_glb_url?.endsWith("c.glb"))!
      expect(cad).toHaveLength(3)
      expect(a.position).toEqual(c.position)
      expect(a.rotation).toEqual(c.rotation)
      const source = circuit.db.source_component
        .list()
        .find((s) => s.name === "J1")!
      const connector = circuit.db.pcb_component
        .list()
        .find((p) => p.source_component_id === source.source_component_id)!
      const center = connector.cable_insertion_center!
      // Independent cardinal expected offsets in board-world XY.
      const x = layer === "bottom" ? -2 : 2
      const offsets = [
        [x, 3],
        [-3, x],
        [-x, -3],
        [3, -x],
      ][pcbRotation / 90]!
      expect(a.position.x).toBeCloseTo(center.x + offsets[0])
      expect(a.position.y).toBeCloseTo(center.y + offsets[1])
      expect(a.position.z).toBeCloseTo(layer === "bottom" ? -4.8 : 4.8)
      expect(a.rotation?.y).toBe(layer === "bottom" ? 180 : 0)
    }
  }
})
