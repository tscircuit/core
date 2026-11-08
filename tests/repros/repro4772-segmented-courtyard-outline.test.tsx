import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"
import { joinImportedCourtyardOutlines } from "lib/utils/join-imported-courtyard-outlines"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro4772: KiCad footprint with four 2-point courtyard line segments joins into a closed polygon, passes placement DRC, and autoroutes", async () => {
  // Simulate an imported KiCad SOT-223-3_TabPin2 footprint whose F.CrtYd is
  // represented as four 2-point pcb_courtyard_outline line segments.
  const importedFootprintElements: AnyCircuitElement[] = [
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_1",
      pcb_component_id: "comp_u1",
      layer: "top",
      shape: "rect",
      x: -3.15,
      y: -2.3,
      width: 1.5,
      height: 0.7,
      port_hints: ["1", "pin1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_2",
      pcb_component_id: "comp_u1",
      layer: "top",
      shape: "rect",
      x: -3.15,
      y: 0,
      width: 1.5,
      height: 0.7,
      port_hints: ["2", "pin2"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad_3",
      pcb_component_id: "comp_u1",
      layer: "top",
      shape: "rect",
      x: -3.15,
      y: 2.3,
      width: 1.5,
      height: 0.7,
      port_hints: ["3", "pin3"],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "crtyd_top",
      pcb_component_id: "comp_u1",
      layer: "top",
      outline: [
        { x: -4.15, y: 3.5 },
        { x: 4.15, y: 3.5 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "crtyd_right",
      pcb_component_id: "comp_u1",
      layer: "top",
      outline: [
        { x: 4.15, y: 3.5 },
        { x: 4.15, y: -3.5 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "crtyd_bottom",
      pcb_component_id: "comp_u1",
      layer: "top",
      outline: [
        { x: 4.15, y: -3.5 },
        { x: -4.15, y: -3.5 },
      ],
    },
    {
      type: "pcb_courtyard_outline",
      pcb_courtyard_outline_id: "crtyd_left",
      pcb_component_id: "comp_u1",
      layer: "top",
      outline: [
        { x: -4.15, y: -3.5 },
        { x: -4.15, y: 3.5 },
      ],
    },
  ]

  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async () => ({
          footprintCircuitJson: importedFootprintElements,
        }),
      },
    },
  })

  circuit.add(
    <board width="30mm" height="20mm">
      <chip
        name="U1"
        footprint="kicad:Package_TO_SOT_SMD/SOT-223-3_TabPin2"
        pcbX={-4}
        pcbY={0}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={-2.3}
      />
      <trace from=".U1 > .pin1" to=".R1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const courtyardOutlines = circuitJson.filter(
    (el) => el.type === "pcb_courtyard_outline",
  )

  // U1's 4 courtyard line segments are joined into a single 4-vertex closed polygon
  // (plus R1's 0402 courtyard outline)
  const u1Component = circuitJson.find(
    (el) =>
      el.type === "pcb_component" &&
      circuitJson.some(
        (src) =>
          src.type === "source_component" &&
          src.source_component_id === el.source_component_id &&
          src.name === "U1",
      ),
  )
  expect(u1Component).toBeDefined()
  const u1Courtyards = courtyardOutlines.filter(
    (c) => c.pcb_component_id === (u1Component as any).pcb_component_id,
  )
  expect(u1Courtyards).toHaveLength(1)
  expect(u1Courtyards[0]!.outline).toHaveLength(4)

  // Placement DRC must succeed without throwing "A ring must enclose a non-zero area"
  // and autorouting must produce the PCB trace between U1 and R1
  const placementErrors = circuitJson.filter(
    (el) => el.type === "pcb_placement_error",
  )
  expect(placementErrors).toHaveLength(0)

  const pcbTraces = circuitJson.filter((el) => el.type === "pcb_trace")
  expect(pcbTraces.length).toBeGreaterThan(0)
})

test("repro4772: degenerate/collinear CourtyardOutline is rejected with a clear error", () => {
  const { circuit } = getTestFixture()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        <courtyardoutline
          outline={[
            { x: -1.5, y: 0.5 },
            { x: 0, y: 0.5 },
            { x: 1.5, y: 0.5 },
          ]}
        />
      </board>,
    )
    circuit.render()
  }).toThrow(/non-zero area/)

  // joinImportedCourtyardOutlines ignores zero-length 2-point segments when joining valid rings
  const joined = joinImportedCourtyardOutlines(
    [
      {
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: "zero_seg",
        pcb_component_id: "c1",
        layer: "top",
        outline: [
          { x: -1, y: 1 },
          { x: -1, y: 1 },
        ],
      },
      {
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: "s1",
        pcb_component_id: "c1",
        layer: "top",
        outline: [
          { x: -1, y: 1 },
          { x: 1, y: 1 },
        ],
      },
      {
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: "s2",
        pcb_component_id: "c1",
        layer: "top",
        outline: [
          { x: 1, y: 1 },
          { x: 1, y: -1 },
        ],
      },
      {
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: "s3",
        pcb_component_id: "c1",
        layer: "top",
        outline: [
          { x: 1, y: -1 },
          { x: -1, y: -1 },
        ],
      },
      {
        type: "pcb_courtyard_outline",
        pcb_courtyard_outline_id: "s4",
        pcb_component_id: "c1",
        layer: "top",
        outline: [
          { x: -1, y: -1 },
          { x: -1, y: 1 },
        ],
      },
    ],
    "U1",
  )
  expect(joined.size).toBe(1)
  expect([...joined.values()][0]).toHaveLength(4)
})
