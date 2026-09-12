import { expect, test } from "bun:test"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { PcbVia } from "lib/components/primitive-components/PcbVia"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("PCB vias emit per-side tenting and migrate legacy imports across footprint flips", () => {
  for (const layer of ["top", "bottom"] as const) {
    for (const rotation of [0, 90, 180, 270]) {
      for (const legacy of [undefined, false, true]) {
        for (const top of [undefined, false, true]) {
          for (const bottom of [undefined, false, true]) {
            const { circuit } = getTestFixture()
            const footprint = new Footprint({})
            const directVia = new PcbVia({
              pcbX: -1,
              layers: ["top", "bottom"],
              isTented: legacy,
              tentedOnTop: top,
              tentedOnBottom: bottom,
            })
            footprint.add(directVia)
            footprint.add(
              createComponentsFromCircuitJson(
                { componentName: "U1", componentRotation: "0" },
                [
                  {
                    type: "pcb_via",
                    pcb_via_id: "imported_via",
                    x: 1,
                    y: 0,
                    hole_diameter: 0.3,
                    outer_diameter: 0.6,
                    layers: ["top", "bottom"],
                    ...{ is_tented: legacy },
                    tented_on_top: top,
                    tented_on_bottom: bottom,
                  },
                ],
              )[0],
            )
            circuit.add(
              <board width={10} height={10}>
                <chip
                  name="U1"
                  layer={layer}
                  pcbRotation={rotation}
                  footprint={footprint as any}
                />
              </board>,
            )
            circuit.render()
            const vias = circuit.db.pcb_via.list()
            expect(vias).toHaveLength(2)
            for (const via of vias) {
              expect({
                top: via.tented_on_top,
                bottom: via.tented_on_bottom,
              }).toEqual({
                top: (layer === "bottom" ? bottom : top) ?? legacy,
                bottom: (layer === "bottom" ? top : bottom) ?? legacy,
              })
              expect(via).not.toHaveProperty("is_tented")
            }
            expect(directVia._parsedProps.tentedOnTop).toEqual(top)
            expect(directVia._parsedProps.tentedOnBottom).toEqual(bottom)
          }
        }
      }
    }
  }
})
