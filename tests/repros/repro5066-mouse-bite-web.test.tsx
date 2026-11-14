import { expect, test } from "bun:test"
import type { PcbHoleCircle } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("mouse-bite rows use the requested tab span and leave a drillable web", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={3}
      col={3}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      {["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"].map(
        (cellName) => (
          <board key={cellName} width="14mm" height="18mm" schematicDisabled>
            <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
            <capacitor
              name="C1"
              capacitance="100nF"
              footprint="0402"
              pcbX={2}
            />
            <trace from=".R1 > .pin2" to=".C1 > .pin1" />
            <pcbnotetext
              text="3 mm tab / 0.63 mm drill"
              fontSize={0.6}
              pcbY={5}
            />
          </board>
        ),
      )}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  let minimumWeb = Number.POSITIVE_INFINITY
  for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
    const hole = holes[holeIndex]!
    for (const otherHole of holes.slice(holeIndex + 1)) {
      minimumWeb = Math.min(
        minimumWeb,
        Math.hypot(hole.x - otherHole.x, hole.y - otherHole.y) -
          (hole.hole_diameter + otherHole.hole_diameter) / 2,
      )
    }
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  // Ray's native KiCad DRC uses ~0.25 mm drill clearance. This is a
  // regression threshold for that fixture, not a universal fab requirement.
  expect(minimumWeb).toBeGreaterThanOrEqual(0.25)
  // Shared board edges reuse the neighboring row. The 12 outer edges each
  // gain a three-drill frame-side row: 108 existing + 36 opposite-end holes.
  expect(holes).toHaveLength(144)
})

test("small boards keep >= 0.5 mm mouse-bite holes at >= 0.8 mm pitch and route traces clear of mouse bites", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      row={3}
      col={3}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabLength="3mm"
    >
      {Array.from({ length: 9 }, (_, boardIndex) => (
        <board key={boardIndex} width="6mm" height="6mm" schematicDisabled>
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-1.2} />
          <capacitor
            name="C1"
            capacitance="100nF"
            footprint="0402"
            pcbX={1.2}
          />
          <trace from=".R1 > .pin2" to=".C1 > .pin1" />
        </board>
      ))}
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  expect(holes.length).toBeGreaterThan(0)
  for (const hole of holes) {
    expect(hole.hole_diameter).toBeGreaterThanOrEqual(0.5)
  }
  let minimumWeb = Number.POSITIVE_INFINITY
  let minimumPitch = Number.POSITIVE_INFINITY
  for (let holeIndex = 0; holeIndex < holes.length; holeIndex++) {
    const hole = holes[holeIndex]!
    for (const otherHole of holes.slice(holeIndex + 1)) {
      const centerDist = Math.hypot(hole.x - otherHole.x, hole.y - otherHole.y)
      minimumPitch = Math.min(minimumPitch, centerDist)
      minimumWeb = Math.min(
        minimumWeb,
        centerDist - (hole.hole_diameter + otherHole.hole_diameter) / 2,
      )
    }
  }
  expect(minimumWeb).toBeGreaterThanOrEqual(0.3 - 1e-6)
  expect(minimumPitch).toBeGreaterThanOrEqual(0.8 - 1e-6)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
})

test("shifts small-board mouse bites outward off fixed pcbPath traces and edge silkscreen without DRC errors", async () => {
  const SmallBoard = () => (
    <board width="10mm" height="6mm" schematicDisabled>
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3.5}
        pcbY={1.5}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={3.5}
        pcbY={1.5}
      />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        thickness="0.15mm"
        pcbPath={[
          { x: 0.51, y: 1.05 },
          { x: 6.49, y: 1.05 },
        ]}
      />
      <silkscreentext text="EDGE" fontSize={0.5} pcbX={0} pcbY={-2.65} />
    </board>
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="5mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
      mouseBites
    >
      <SmallBoard />
      <SmallBoard />
    </panel>,
  )
  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  // 16 board-edge drills + 12 outer far-end frame drills = 28 total holes
  expect(holes).toHaveLength(28)
  for (const hole of holes) {
    expect(hole.hole_diameter).toBeGreaterThanOrEqual(0.5)
  }

  let minimumPitch = Number.POSITIVE_INFINITY
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      minimumPitch = Math.min(
        minimumPitch,
        Math.hypot(holes[i]!.x - holes[j]!.x, holes[i]!.y - holes[j]!.y),
      )
    }
  }
  expect(minimumPitch).toBeGreaterThanOrEqual(0.8 - 1e-6)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)

  // Verify every mouse bite maintains >= 0.25 mm copper clearance to fixed traces
  for (const trace of circuit.db.pcb_trace.list()) {
    for (let i = 0; i + 1 < trace.route.length; i++) {
      const a = trace.route[i]!
      const b = trace.route[i + 1]!
      if (!("x" in a) || !("x" in b)) continue
      const halfW =
        Math.max(
          a.route_type === "wire" ? a.width : 0,
          b.route_type === "wire" ? b.width : 0,
          0.15,
        ) / 2
      for (const hole of holes) {
        const dx = b.x - a.x
        const dy = b.y - a.y
        const lenSq = dx * dx + dy * dy
        const t =
          lenSq > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((hole.x - a.x) * dx + (hole.y - a.y) * dy) / lenSq,
                ),
              )
            : 0
        const dist = Math.hypot(
          hole.x - (a.x + t * dx),
          hole.y - (a.y + t * dy),
        )
        const gap = dist - halfW - hole.hole_diameter / 2
        expect(gap).toBeGreaterThanOrEqual(0.25 - 1e-5)
      }
    }
  }
})

test("clears 0.8 mm VCC silkscreen 1.2 mm from a 10.4x6 mm board edge while keeping far-end tab drill rows", async () => {
  const VccCell = () => (
    <board width="10.4mm" height="6mm" schematicDisabled>
      <silkscreentext text="VCC" fontSize={0.8} pcbX={4.0} pcbY={0.1} />
    </board>
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="5mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
      mouseBites
    >
      <VccCell />
      <VccCell />
    </panel>,
  )
  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  expect(holes).toHaveLength(28)

  const rightFrameHoles = holes.filter((h) => h.x > 6.0)
  expect(rightFrameHoles).toHaveLength(4)

  const rightBoardEdgeHoles = holes.filter((h) => h.x > 5.0 && h.x < 6.0)
  expect(rightBoardEdgeHoles).toHaveLength(4)

  const shiftedRightHoles = rightBoardEdgeHoles.filter((h) => h.x > 5.25)
  expect(shiftedRightHoles.length).toBeGreaterThanOrEqual(2)
  for (const hole of shiftedRightHoles) {
    expect(hole.x - hole.hole_diameter / 2).toBeGreaterThanOrEqual(5.2 - 1e-6)
  }

  let minimumPitch = Number.POSITIVE_INFINITY
  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      minimumPitch = Math.min(
        minimumPitch,
        Math.hypot(holes[i]!.x - holes[j]!.x, holes[i]!.y - holes[j]!.y),
      )
    }
  }
  expect(minimumPitch).toBeGreaterThanOrEqual(0.8 - 1e-6)
})

test("omits an individual mouse bite when copper crosses directly through the tab span and names mouse-bite holes in DRC diagnostics", async () => {
  const { formatPanelMouseBiteDrcDiagnostics } = await import(
    "lib/utils/panels/reconcile-panel-mouse-bite-clearances"
  )

  expect(formatPanelMouseBiteDrcDiagnostics([])).toEqual([])

  const formatted = formatPanelMouseBiteDrcDiagnostics([
    {
      type: "pcb_trace_error",
      error_type: "pcb_trace_error",
      pcb_trace_error_id: "overlap_pcb_trace_0_panel_mouse_bite_7",
      pcb_trace_id: "pcb_trace_0",
      source_trace_id: "source_trace_0",
      pcb_component_ids: [],
      pcb_port_ids: [],
      message:
        "Trace .R1 > .pin2 to .R2 > .pin1 is too close to non-plated hole unnamed hole (gap: 0.125000mm, required: 0.2mm)",
    },
    {
      type: "pcb_trace_error",
      error_type: "pcb_trace_error",
      pcb_trace_error_id: "overlap_pcb_trace_0_pcb_hole_2",
      pcb_trace_id: "pcb_trace_0",
      source_trace_id: "source_trace_0",
      pcb_component_ids: [],
      pcb_port_ids: [],
      message:
        "Trace .R1 > .pin2 to .R2 > .pin1 is too close to non-plated hole unnamed hole (gap: 0.100000mm, required: 0.2mm)",
    },
  ])
  expect(formatted[0]?.message).toContain(
    "mouse-bite hole (panel_mouse_bite_7)",
  )
  expect(formatted[0]?.message).not.toContain("unnamed hole")
  expect(formatted[1]?.message).toContain("unnamed hole")

  // Panel-level manual trace crossing straight across the shared tab between two 6x6mm boards
  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
      mouseBites
    >
      <board name="B1" width="6mm" height="6mm" schematicDisabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-0.4}
          pcbY={1.5}
        />
      </board>
      <board name="B2" width="6mm" height="6mm" schematicDisabled>
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={-0.4}
          pcbY={-1.5}
        />
      </board>
      <trace
        from=".B1 > .R1 > .pin1"
        to=".B2 > .R2 > .pin1"
        thickness="0.2mm"
        pcbPath={[
          { x: -0.4, y: -2.5 },
          { x: -0.4, y: 2.5 },
        ]}
      />
    </panel>,
  )
  await circuit.renderUntilSettled()
  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  // Unobstructed bites remain (including outer far-end rows), while the obstructed x=-0.4 shared-tab bites are omitted
  expect(holes.length).toBeGreaterThan(20)
  expect(holes.length).toBeLessThan(28)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
})

test("reconciles mouse bites after Phase-78 SilkscreenOverlapAdjustment flips passive refdes toward a tab edge", async () => {
  const StackedEdgePassivesBoard = () => (
    <board width="10mm" height="6mm" schematicDisabled>
      {/* R4 overlaps R3's default top refdes, causing Phase-78 SilkscreenOverlapAdjustment
          to flip R3's silkscreen downward toward the y = -3 mm bottom tab edge */}
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-0.4}
        pcbY={-2.25}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        pcbX={-0.4}
        pcbY={-1.45}
      />
    </board>
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="5mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="3mm"
      mouseBites
    >
      <StackedEdgePassivesBoard />
      <StackedEdgePassivesBoard />
    </panel>,
  )
  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  const r3Texts = circuit.db.pcb_silkscreen_text
    .list()
    .filter((t) => t.text === "R3")
  expect(r3Texts.length).toBe(2)

  // Every remaining mouse bite must stay clear of the flipped R3 silkscreen glyphs
  for (const r3Text of r3Texts) {
    for (const hole of holes) {
      const dist = Math.hypot(
        hole.x - r3Text.anchor_position.x,
        hole.y - r3Text.anchor_position.y,
      )
      expect(dist - hole.hole_diameter / 2).toBeGreaterThanOrEqual(0.25)
    }
  }
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)
})

test("handles +Y-up top/bottom silkscreen anchors, panel-rail counterpart inward shifts, and hole_with_polygon_pad clearances", async () => {
  const { reconcilePanelMouseBiteClearances } = await import(
    "lib/utils/panels/reconcile-panel-mouse-bite-clearances"
  )
  const { getPanelMouseBiteCandidates } = await import(
    "lib/utils/panels/get-panel-mouse-bite-positions"
  )
  const Flatten = await import("@flatten-js/core")

  const rectOutline = [
    { x: -5, y: -3 },
    { x: 5, y: -3 },
    { x: 5, y: 3 },
    { x: -5, y: 3 },
  ]

  // 1. +Y-up top_center silkscreen anchor hangs downward [-height, 0] into the y = -3 edge
  const topAnchorRes = reconcilePanelMouseBiteClearances({
    candidates: [
      {
        pcb_hole_id: "panel_mouse_bite_top_anchor",
        position: { x: 0, y: -3 },
        shiftDirection: { x: 0, y: -1 },
        oppositeEdgeDistance: 2,
      },
    ],
    holeDiameter: 0.5,
    minimumDrillPitch: 0.8,
    boardOutlines: [rectOutline],
    elements: [
      {
        type: "pcb_silkscreen_text",
        pcb_silkscreen_text_id: "st_top",
        font: "tscircuit2024",
        font_size: 0.6,
        layer: "top",
        pcb_component_id: "c1",
        text: "TOP",
        anchor_position: { x: 0, y: -2.35 },
        anchor_alignment: "top_center",
      },
    ],
  })
  expect(topAnchorRes.removedHoleIds).toEqual([])
  expect(topAnchorRes.kept[0]!.y).toBeLessThan(-3.4)

  // 2. Panel-frame counterpart (oppositeEdge) drill shifts inward (-outwardNormal) into tab bridge
  const candidates = getPanelMouseBiteCandidates({
    mouseBites: [
      {
        boardEdge: { x: 0, y: 3 },
        outwardNormal: Flatten.vector(0, 1),
        bridgeOutline: [
          { x: -1.5, y: 2.9 },
          { x: 1.5, y: 2.9 },
          { x: 1.5, y: 5.1 },
          { x: -1.5, y: 5.1 },
        ],
      },
    ],
    routingCutouts: [
      {
        type: "pcb_cutout",
        pcb_cutout_id: "cut_slot",
        shape: "rect",
        center: { x: 0, y: 4 },
        width: 10,
        height: 2,
      },
    ],
    minimumDrillPitch: 0.8,
  })
  expect(candidates).toHaveLength(2)
  expect(candidates[1]!.position).toEqual({ x: 0, y: 5 })
  expect(candidates[1]!.shiftDirection).toEqual({ x: -0, y: -1 })

  const railShiftRes = reconcilePanelMouseBiteClearances({
    candidates: candidates.map((c, idx) => ({
      ...c,
      pcb_hole_id: `panel_mouse_bite_${idx}`,
    })),
    holeDiameter: 0.5,
    minimumDrillPitch: 0.8,
    boardOutlines: [rectOutline],
    elements: [
      {
        type: "pcb_via",
        pcb_via_id: "rail_via_0",
        x: 0,
        y: 5.65,
        hole_diameter: 0.3,
        outer_diameter: 0.6,
        layers: ["top", "bottom"],
      },
    ],
  })
  expect(railShiftRes.removedHoleIds).toEqual([])
  expect(railShiftRes.kept[1]!.y).toBeGreaterThan(3.8)
  expect(railShiftRes.kept[1]!.y).toBeLessThan(4.9)

  // 3. Plated hole with shape === "hole_with_polygon_pad" shifts edge drill clear of polygon pad
  const polyPadRes = reconcilePanelMouseBiteClearances({
    candidates: [
      {
        pcb_hole_id: "panel_mouse_bite_polypad",
        position: { x: 0, y: 3 },
        shiftDirection: { x: 0, y: 1 },
        oppositeEdgeDistance: 2,
      },
    ],
    holeDiameter: 0.5,
    minimumDrillPitch: 0.8,
    boardOutlines: [rectOutline],
    elements: [
      {
        type: "pcb_plated_hole",
        pcb_plated_hole_id: "ph_poly",
        shape: "hole_with_polygon_pad",
        hole_shape: "circle",
        hole_diameter: 0.3,
        x: 0,
        y: 2.6,
        hole_offset_x: 0,
        hole_offset_y: 0,
        pad_outline: [
          { x: -0.4, y: -0.3 },
          { x: 0.4, y: -0.3 },
          { x: 0.4, y: 0.3 },
          { x: -0.4, y: 0.3 },
        ],
        layers: ["top", "bottom"],
      },
    ],
  })
  expect(polyPadRes.removedHoleIds).toEqual([])
  expect(polyPadRes.kept[0]!.y).toBeGreaterThanOrEqual(3.4 - 1e-6)
})

test("reconciles concave CW polygon boards with _subcircuitCachingEnabled and exports clean KiCad np_thru_hole drills", async () => {
  const { CircuitJsonToKicadPcbConverter } = await import(
    "circuit-json-to-kicad"
  )

  // Clockwise concave L-shaped board outline
  const cwConcaveOutline = [
    { x: -4, y: -3 },
    { x: -4, y: 3 },
    { x: 1, y: 3 },
    { x: 1, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: -3 },
  ]

  const CachedConcaveBoard = ({ name }: { name: string }) => (
    <board
      name={name}
      outline={cwConcaveOutline}
      _subcircuitCachingEnabled
      schematicDisabled
    >
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-1.5}
        pcbY={-1.5}
      />
      <silkscreentext text="L-EDGE" fontSize={0.5} pcbX={0} pcbY={-2.65} />
    </board>
  )

  const { circuit } = getTestFixture()
  circuit.add(
    <panel
      layoutMode="grid"
      col={1}
      boardGap="2mm"
      edgePadding="5mm"
      panelizationMethod="tab-routing"
      tabWidth="2mm"
      tabLength="2.5mm"
      mouseBites
    >
      <CachedConcaveBoard name="LB1" />
      <CachedConcaveBoard name="LB2" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  const holes = circuit.db.pcb_hole
    .list()
    .filter((hole): hole is PcbHoleCircle => hole.hole_shape === "circle")
  expect(holes.length).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace_error.list()).toHaveLength(0)

  const kicadConverter = new CircuitJsonToKicadPcbConverter(circuit.toJson())
  kicadConverter.runUntilFinished()
  const kicadSexp = kicadConverter.getOutputString()
  expect(kicadSexp).toContain("np_thru_hole")
})
