import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import supplierFootprint from "tests/fixtures/parts/C916374.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "normalizes the same physical supplier pads from native top and bottom footprint sources",
  async () => {
    const supplierJson = supplierFootprint as AnyCircuitElement[]
    const pads = supplierJson.flatMap((pad) =>
      pad.type === "pcb_smtpad" && pad.shape === "rect" ? [pad] : [],
    )
    expect(pads).toHaveLength(3)
    for (const originalLayer of ["top", "bottom"] as const) {
      for (const layer of ["top", "bottom"] as const) {
        const { circuit } = getTestFixture({
          platform: {
            partsEngine: {
              findPart: () => ({ jlcpcb: ["C916374"] }),
              fetchPartCircuitJson: () => supplierJson,
            },
          },
        })
        circuit.add(
          <board width={42} height={12} routingDisabled>
            {[0, 90, 180, 270].map((rotation, index) => (
              <chip
                key={rotation}
                name={`U${index + 1}`}
                pcbX={-15 + index * 10}
                pcbRotation={rotation}
                layer={layer}
                supplierPartNumbers={{ jlcpcb: ["C916374"] }}
                footprint={
                  <footprint originalLayer={originalLayer}>
                    {pads.map((pad) => (
                      <smtpad
                        portHints={pad.port_hints}
                        // A native-bottom source already contains the physical
                        // X reflection. Both sources describe identical pads.
                        pcbX={originalLayer === "bottom" ? -pad.x : pad.x}
                        pcbY={pad.y}
                        width={pad.width}
                        height={pad.height}
                        shape="rect"
                      />
                    ))}
                  </footprint>
                }
              />
            ))}
          </board>,
        )
        await circuit.renderUntilSettled()
        for (const pcb of circuit.db.pcb_component.list()) {
          expect(pcb.pin1_location).toBe("rightside_bottom")
          expect(pcb.supplier_pin1_location_map).toEqual({
            jlcpcb: "rightside_bottom",
          })
        }
      }
    }
  },
)
