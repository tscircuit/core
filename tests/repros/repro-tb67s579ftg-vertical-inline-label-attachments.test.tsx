import { expect, test } from "bun:test"
import {
  getBoundsCenter,
  getBoundsFromPoints,
  pointToSegmentDistance,
} from "@tscircuit/math-utils"
import type {
  AnyCircuitElement,
  SchematicCircle,
  SchematicRect,
} from "circuit-json"
import { getSchematicTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { sel } from "lib/sel"
import { applyToPoint, rotateDEG } from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const driverPinLabels = {
  pin1: "AGC_OUT",
  pin2: "TEST",
  pin3: "VM",
  pin4: "OUT_A_P",
  pin5: "ATEST",
  pin6: "OUT_A_N",
  pin7: "OUT_B_N",
  pin8: "RSG",
  pin9: "OUT_B_P",
  pin10: "VM",
  pin11: "ADMD",
  pin12: "AGC_AUTO",
  pin13: "AGC_ON",
  pin14: "AWGS",
  pin15: "AGND_1",
  pin16: "GND",
  pin17: "STOP_DET_VTH",
  pin18: "OSCM",
  pin19: "KPKI_NANO",
  pin20: "AGC_TIME",
  pin21: "FREQ_MIN",
  pin22: "VSP_MIN",
  pin23: "AGC_KI",
  pin24: "AGC_KP",
  pin25: "TARGET_ANGLE",
  pin26: "NFHYS",
  pin27: "MTBLANK",
  pin28: "STBLANK",
  pin29: "CTBLANK",
  pin30: "VREG",
  pin31: "LO2",
  pin32: "LO1",
  pin33: "LO0",
  pin34: "MO",
  pin35: "VREF",
  pin36: "SLEEP_X",
  pin37: "RESET_X",
  pin38: "CW_CCW",
  pin39: "ENABLE",
  pin40: "CLK",
  pin41: "DMODE0",
  pin42: "DMODE1",
  pin43: "DMODE2",
  pin44: "DECAY1",
  pin45: "DECAY2",
  pin46: "AGND_2",
  pin47: "SERIAL_CLK",
  pin48: "SERIAL_IN",
  pin49: "PGND",
} as const

const leftHeaderLabels = {
  pin1: "VIN",
  pin2: "VM",
  pin3: "STOP_DET_VTH",
  pin4: "KPKI_NANO",
  pin5: "AGC_TIME",
  pin6: "FREQ_MIN",
  pin7: "VSP_MIN",
  pin8: "AGC_KI",
  pin9: "AGC_KP",
  pin10: "TARGET_ANGLE",
  pin11: "NFHYS",
  pin12: "MTBLANK",
  pin13: "STBLANK",
  pin14: "CTBLANK",
  pin15: "IOREF",
  pin16: "VREG",
  pin17: "GND_1",
  pin18: "GND_2",
  pin19: "GND_3",
} as const

const controlHeaderLabels = {
  pin1: "A_P",
  pin2: "A_N",
  pin3: "B_N",
  pin4: "B_P",
  pin5: "SERIAL_IN",
  pin6: "SERIAL_CLK",
  pin7: "DMODE2",
  pin8: "DMODE1",
  pin9: "DMODE0",
  pin10: "CLK",
  pin11: "CW_CCW",
  pin12: "ENABLE",
  pin13: "RESET_X",
  pin14: "SLEEP_X",
  pin15: "LO2",
  pin16: "LO1",
  pin17: "LO0",
  pin18: "MO",
  pin19: "AGC_OUT",
} as const

type DriverPinName =
  | keyof typeof driverPinLabels
  | (typeof driverPinLabels)[keyof typeof driverPinLabels]
type LeftHeaderPinName =
  | keyof typeof leftHeaderLabels
  | (typeof leftHeaderLabels)[keyof typeof leftHeaderLabels]
type ControlHeaderPinName =
  | keyof typeof controlHeaderLabels
  | (typeof controlHeaderLabels)[keyof typeof controlHeaderLabels]

const u1 = sel.U1<DriverPinName>()
const j1 = sel.J1<LeftHeaderPinName>()
const j4 = sel.J4<ControlHeaderPinName>()

const bottomPins = [
  17, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 13, 14, 12, 11, 45, 44, 35, 1,
  18,
]

const topPins = [
  4, 6, 7, 9, 48, 47, 43, 42, 41, 40, 38, 39, 37, 36, 31, 32, 33, 34,
]

const TB67S579FTGBreakoutSchematic = () => (
  <board width="24mm" height="18mm" routingDisabled schMaxTraceDistance={20}>
    <schematicsection name="TB67S579FTG breakout" />
    <chip
      name="U1"
      schSectionName="TB67S579FTG breakout"
      manufacturerPartNumber="TB67S579FTG"
      pinLabels={driverPinLabels}
      schX={0}
      schY={0}
      schWidth={6.35}
      schHeight={3.29}
      pcbX={0}
      pcbY={0}
      schPinArrangement={{
        bottomSide: { pins: bottomPins, direction: "left-to-right" },
        leftSide: { pins: [3, 10, 30], direction: "bottom-to-top" },
        topSide: { pins: topPins, direction: "left-to-right" },
        rightSide: {
          pins: [2, 5, 8, 15, 16, 46, 49],
          direction: "bottom-to-top",
        },
      }}
      schPinStyle={{
        pin13: { marginLeft: 0.4 },
        pin35: { marginLeft: 0.4 },
        pin18: { marginLeft: 0.4 },
        pin48: { marginLeft: 1.1 },
        pin31: { marginLeft: 0.7 },
        pin30: { marginBottom: 1.245 },
        pin10: { marginBottom: 1.245 },
        pin2: { marginTop: 0.282 },
        pin5: { marginTop: 0.282 },
        pin8: { marginTop: 0.282 },
        pin15: { marginTop: 0.282 },
        pin16: { marginTop: 0.282 },
        pin46: { marginTop: 0.28 },
      }}
    />

    <connector
      name="J1"
      schSectionName="TB67S579FTG breakout"
      pinLabels={leftHeaderLabels}
      schHeight={2.24}
      schX={-1.2}
      schY={-7}
      pcbX={-8}
      pcbY={5}
      schPinArrangement={{
        topSide: {
          pins: Array.from({ length: 19 }, (_, index) => index + 1),
          direction: "left-to-right",
        },
      }}
    />

    <connector
      name="J4"
      schSectionName="TB67S579FTG breakout"
      pinLabels={controlHeaderLabels}
      schHeight={2.05}
      schX={-0.5}
      schY={4.6}
      pcbX={8}
      pcbY={-5}
      schPinArrangement={{
        bottomSide: {
          pins: Array.from({ length: 19 }, (_, index) => index + 1),
          direction: "left-to-right",
        },
      }}
    />

    <trace name="STOP_DET_VTH" from={j1.STOP_DET_VTH} to={u1.STOP_DET_VTH} />
    <trace name="KPKI_NANO" from={j1.KPKI_NANO} to={u1.KPKI_NANO} />
    <trace name="AGC_TIME" from={j1.AGC_TIME} to={u1.AGC_TIME} />
    <trace name="FREQ_MIN" from={j1.FREQ_MIN} to={u1.FREQ_MIN} />
    <trace name="VSP_MIN" from={j1.VSP_MIN} to={u1.VSP_MIN} />
    <trace name="AGC_KI" from={j1.AGC_KI} to={u1.AGC_KI} />
    <trace name="AGC_KP" from={j1.AGC_KP} to={u1.AGC_KP} />
    <trace name="TARGET_ANGLE" from={j1.TARGET_ANGLE} to={u1.TARGET_ANGLE} />
    <trace name="NFHYS" from={j1.NFHYS} to={u1.NFHYS} />
    <trace name="MTBLANK" from={j1.MTBLANK} to={u1.MTBLANK} />
    <trace name="STBLANK" from={j1.STBLANK} to={u1.STBLANK} />
    <trace name="CTBLANK" from={j1.CTBLANK} to={u1.CTBLANK} />
    <trace name="VM_1" from={j1.pin2} to={u1.pin3} />
    <trace name="VM_2" from={j1.pin2} to={u1.pin10} />
    <trace name="VREG" from={j1.VREG} to={u1.VREG} />
    <trace name="GND" from={j1.GND_1} to={u1.GND} />

    <trace name="OUT_A_P" from={j4.pin1} to={u1.pin4} />
    <trace name="OUT_A_N" from={j4.pin2} to={u1.pin6} />
    <trace name="OUT_B_N" from={j4.pin3} to={u1.pin7} />
    <trace name="OUT_B_P" from={j4.pin4} to={u1.pin9} />
    <trace name="SERIAL_IN" from={j4.SERIAL_IN} to={u1.SERIAL_IN} />
    <trace name="SERIAL_CLK" from={j4.SERIAL_CLK} to={u1.SERIAL_CLK} />
    <trace name="DMODE2" from={j4.DMODE2} to={u1.DMODE2} />
    <trace name="DMODE1" from={j4.DMODE1} to={u1.DMODE1} />
    <trace name="DMODE0" from={j4.DMODE0} to={u1.DMODE0} />
    <trace name="CLK" from={j4.CLK} to={u1.CLK} />
    <trace name="CW_CCW" from={j4.CW_CCW} to={u1.CW_CCW} />
    <trace name="ENABLE" from={j4.ENABLE} to={u1.ENABLE} />
    <trace name="RESET_X" from={j4.RESET_X} to={u1.RESET_X} />
    <trace name="SLEEP_X" from={j4.SLEEP_X} to={u1.SLEEP_X} />
    <trace name="LO2" from={j4.LO2} to={u1.LO2} />
    <trace name="LO1" from={j4.LO1} to={u1.LO1} />
    <trace name="LO0" from={j4.LO0} to={u1.LO0} />
    <trace name="MO" from={j4.MO} to={u1.MO} />
    <trace name="AGC_OUT" from={j4.AGC_OUT} to={u1.AGC_OUT} />
  </board>
)

// The existing TB67 breakout with J4 moved from (7, -0.4) to (4.6, 0.5).
// Vertical layout of the existing TB67 breakout: U1 pin rows move to the
// top/bottom, J1 sits below U1, and J4 above it. Components and connections
// are unchanged. Normal schematic layout props produce the routed bends.
test("TB67 vertical bent-route inline label positions", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<TB67S579FTGBreakoutSchematic />)
  await circuit.renderUntilSettled()

  // Add guides only to the snapshot input after Core has finished rendering.
  // Bounds and circle centers are points in schematic-world mm (+x right, +y up).
  const guides: (SchematicRect | SchematicCircle)[] = []
  const detail: AnyCircuitElement[] = []
  const stubGuides: (SchematicRect | SchematicCircle)[] = []
  const stubDetail: AnyCircuitElement[] = []
  for (const [name, anchor] of [
    ["OUT_A_P", "bottom_left"],
    ["OUT_B_P", "top_right"],
    ["AGC_OUT", "bottom_right"],
  ] as const) {
    const labels = circuit.db.schematic_text
      .list()
      .filter((text) => text.text === name)
    expect(labels).toHaveLength(1)
    const label = labels[0]!
    const sourceTrace = circuit.db.source_trace.get(label.source_trace_id!)!
    const traces = circuit.db.schematic_trace.list({
      subcircuit_connectivity_map_key:
        sourceTrace.subcircuit_connectivity_map_key,
    })
    expect(traces).toHaveLength(1)
    const edges = traces[0]!.edges
    expect(
      edges.some(
        (edge) =>
          pointToSegmentDistance(label.position, edge.from, edge.to) < 1e-6,
      ),
    ).toBe(true)
    expect(label.anchor).toBe(anchor)
    expect(label.rotation).toBe(-90)
    if (name === "AGC_OUT") {
      expect(traces[0]!.edges).toHaveLength(1)
      const edge = traces[0]!.edges[0]!
      expect(edge.from.x).toBeCloseTo(edge.to.x)
      expect(edge.to.y).toBeLessThan(edge.from.y)
    }

    const bounds = getSchematicTextBounds({
      text: label.text,
      position: label.position,
      anchor: label.anchor,
      fontSize: label.font_size!,
    })
    // Text rotation is clockwise-positive in SVG; this transform is in
    // schematic world coordinates (+x right, +y up), so negate that angle.
    const textRotation = rotateDEG(
      -label.rotation!,
      label.position.x,
      label.position.y,
    )
    const labelGuides = name === "AGC_OUT" ? stubGuides : guides
    labelGuides.push(
      {
        type: "schematic_rect",
        schematic_rect_id: `bounds_${label.schematic_text_id}`,
        center: applyToPoint(textRotation, getBoundsCenter(bounds)),
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        rotation: label.rotation!,
        color: "#2563eb",
        is_filled: false,
        is_dashed: true,
        stroke_width: 0.008,
      },
      {
        type: "schematic_circle",
        schematic_circle_id: `position_${label.schematic_text_id}`,
        center: label.position,
        radius: 0.015,
        color: "#2563eb",
        is_filled: true,
        is_dashed: false,
        stroke_width: 0.008,
      },
    )
    const view = name === "AGC_OUT" ? stubDetail : detail
    view.push(...traces, label)
  }

  await expect([
    ...circuit.getCircuitJson(),
    ...guides,
    ...stubGuides,
  ]).toMatchSchematicSnapshot(import.meta.path, { grid: false })
  for (const [suffix, view, viewGuides] of [
    ["detail", detail, guides],
    ["straight-stub", stubDetail, stubGuides],
  ] as const) {
    const detailBounds = getBoundsFromPoints(
      view.flatMap((element) =>
        element.type === "schematic_trace"
          ? element.edges.flatMap((edge) => [edge.from, edge.to])
          : [],
      ),
    )!
    view.push({
      type: "schematic_text",
      schematic_text_id: "attachment_guide_legend",
      text: "Dashed: text bounds / Blue dot: saved position",
      position: {
        x: (detailBounds.minX + detailBounds.maxX) / 2,
        y: detailBounds.maxY + 0.3,
      },
      anchor: "center",
      rotation: 0,
      font_size: 0.045,
      color: "#2563eb",
    })
    await expect([...view, ...viewGuides]).toMatchSchematicSnapshot(
      import.meta.path.replace(".test.tsx", `-${suffix}.test.tsx`),
      { grid: false, width: 1000, height: 700 },
    )
  }
})
