import type { AnyCircuitElement } from "circuit-json"
import sot223Footprint from "tests/fixtures/assets/sot-223-3-tabpin2-segmented-courtyard.circuit.json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Pads and courtyards converted with kicad-to-circuit-json 0.0.142 from:
// https://github.com/KiCad/kicad-footprints/blob/bed97db7da956ddcef1ff79f17c9c706031a2d73/Package_TO_SOT_SMD.pretty/SOT-223-3_TabPin2.kicad_mod
// The legacy 3D model block was omitted before conversion; PCB geometry is unchanged.
// Keep the converted data local so this repro never fetches a footprint service.
export const createKicadSegmentedCourtyardCircuit = ({
  closedCourtyard = false,
} = {}) => {
  let autoroutingStartCount = 0
  let footprintLoadCount = 0
  const footprintCircuitJson = structuredClone(
    sot223Footprint,
  ) as AnyCircuitElement[]

  if (closedCourtyard) {
    // Control: replace only the four boundary segments with the same rectangle.
    // All pad geometry, components, placement, traces and DRC settings stay identical.
    const firstCourtyard = footprintCircuitJson.find(
      (elm) => elm.type === "pcb_courtyard_outline",
    )!
    footprintCircuitJson.splice(
      0,
      footprintCircuitJson.length,
      ...footprintCircuitJson.filter(
        (elm) => elm.type !== "pcb_courtyard_outline",
      ),
      {
        ...firstCourtyard,
        type: "pcb_courtyard_outline",
        outline: [
          { x: -4.4, y: -3.6 },
          { x: 4.4, y: -3.6 },
          { x: 4.4, y: 3.6 },
          { x: -4.4, y: 3.6 },
        ],
      },
    )
  }

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => {
          footprintLoadCount++
          return { footprintCircuitJson }
        },
      },
    },
  })
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })
  circuit.add(
    <board
      width="30mm"
      height="20mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <chip
        name="U1"
        footprint="kicad:Package_TO_SOT_SMD/SOT-223-3_TabPin2"
        pinLabels={{ pin1: "IN", pin2: "GND", pin3: "OUT" }}
        pcbX={-7}
      />
      <resistor name="R1" resistance="1k" footprint="0603" pcbX={8} />
      <trace name="A" from=".U1 > .OUT" to=".R1 > .pin1" />
      <trace name="B" from=".R1 > .pin2" to=".U1 > .GND" />
      {/* This independent net demonstrates that the entire board is blocked. */}
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={0} pcbY={6} />
      <resistor name="R3" resistance="1k" footprint="0603" pcbX={7} pcbY={6} />
      <trace name="C" from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )
  return {
    circuit,
    getAutoroutingStartCount: () => autoroutingStartCount,
    getFootprintLoadCount: () => footprintLoadCount,
  }
}
