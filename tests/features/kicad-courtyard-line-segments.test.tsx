import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pad = (n: number, x: number, y: number, w: number, h: number) => ({
  type: "pcb_smtpad",
  pcb_smtpad_id: `pad${n}`,
  shape: "rect",
  x,
  y,
  width: w,
  height: h,
  layer: "top",
  port_hints: [`${n}`],
})

// KiCad draws this courtyard as four separate fp_lines, so each one is
// imported as its own two-point outline
const corners = [
  { x: -4, y: -3.5 },
  { x: 4, y: -3.5 },
  { x: 4, y: 3.5 },
  { x: -4, y: 3.5 },
]
const fourSegmentLoader = async () => ({
  footprintCircuitJson: [
    pad(1, -3.15, -2.3, 2, 1.5),
    pad(2, -3.15, 0, 2, 1.5),
    pad(3, -3.15, 2.3, 2, 1.5),
    ...corners.map((c, i) => ({
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: `cy${i}`,
      pcb_component_id: "",
      layer: "top",
      outline: [c, corners[(i + 1) % 4]],
    })),
  ],
})

test(
  "kicad footprint with four-segment courtyard does not break placement checks",
  async () => {
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          kicad: fourSegmentLoader,
        },
      },
    })

    circuit.add(
      <board width="30mm" height="20mm">
        <chip
          name="U1"
          footprint="kicad:Package_TO_SOT_SMD/SOT-223-3_TabPin2"
          pinLabels={{ pin1: "IN", pin2: "GND", pin3: "OUT" }}
          pcbX={-7}
          pcbY={0}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0603"
          pcbX={8}
          pcbY={0}
        />
        <trace name="A" from=".U1 > .OUT" to=".R1 > .pin1" />
        <trace name="B" from=".R1 > .pin2" to=".U1 > .GND" />
      </board>,
    )

    await circuit.renderUntilSettled()

    const outlines = circuit.db.pcb_courtyard_outline.list()
    for (const outline of outlines) {
      expect(outline.outline.length).toBeGreaterThanOrEqual(3)
    }
    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)

    expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showCourtyards: true,
    })
  },
  { timeout: 60000 },
)
