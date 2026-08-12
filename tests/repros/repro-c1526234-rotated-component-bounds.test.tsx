import { expect, test } from "bun:test"
import type {
  AnyCircuitElement,
  PcbComponent,
  PcbCourtyardOutline,
  PcbCourtyardRect,
} from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Frozen copper and courtyard geometry returned for jlcpcb:C1526234. Keeping
// it local makes this core regression deterministic and independent of EasyEDA.
const c1526234Pads = [
  [1, "HCI_CTS", -6.574917, 2.250059, 0.499999, 0.499999],
  [2, "HCI_TX", -6.574917, 1.350137, 0.499999, 0.499999],
  [3, "HCI_RX", -6.574917, 0.450215, 0.499999, 0.499999],
  [4, "HCI_RTS", -6.574917, -0.449961, 0.499999, 0.499999],
  [5, "GND1", -6.574917, -1.349883, 0.499999, 0.499999],
  [6, "NC1", -6.574917, -2.249805, 0.499999, 0.499999],
  [7, "GND2", -5.775071, -3.049905, 0.499999, 0.499999],
  [8, "SLOW_CLK_IN", -4.874895, -3.049905, 0.499999, 0.499999],
  [9, "GND3", -3.974973, -3.049905, 0.499999, 0.499999],
  [10, "NC2", -3.075051, -3.049905, 0.499999, 0.499999],
  [11, "NC3", -2.174875, -3.049905, 0.499999, 0.499999],
  [12, "VDD_IN", -1.274953, -3.049905, 0.499999, 0.499999],
  [13, "GND4", -0.474853, -2.249805, 0.499999, 0.499999],
  [14, "BT_ANTNC", -0.474853, -1.349883, 0.499999, 0.499999],
  [15, "GND5", -0.474853, -0.449961, 0.499999, 0.499999],
  [16, "nSHUTD", -0.474853, 0.450215, 0.499999, 0.499999],
  [17, "GND6", -0.474853, 1.350137, 0.499999, 0.499999],
  [18, "VDD_IO", -0.474853, 2.250059, 0.499999, 0.499999],
  [19, "AUD_IN", -1.274953, 3.050159, 0.499999, 0.499999],
  [20, "AUD_OUT", -2.174875, 3.050159, 0.499999, 0.499999],
  [21, "AUD_CLK", -3.075051, 3.050159, 0.499999, 0.499999],
  [22, "AUD_FSYNC", -3.974973, 3.050159, 0.499999, 0.499999],
  [23, "NC4", -4.874895, 3.050159, 0.499999, 0.499999],
  [24, "TX_DBG", -5.775071, 3.050159, 0.499999, 0.499999],
  [25, "GNDPAD1", -5.125085, 0.000127, 0.999998, 0.999998],
  [26, "GNDPAD2", -3.524885, -1.599819, 0.999998, 0.999998],
  [27, "GNDPAD3", -3.524885, 0.000127, 0.999998, 0.999998],
  [28, "GNDPAD4", -3.524885, 1.600073, 0.999998, 0.999998],
  [29, "GNDPAD5", -1.924939, 0.000127, 0.999998, 0.999998],
  [30, "GNDPAD6", -6.574917, 3.050159, 0.499999, 0.499999],
  [31, "GNDPAD7", -6.574917, -3.049905, 0.499999, 0.499999],
  [32, "GNDPAD8", -0.474853, -3.049905, 0.499999, 0.499999],
  [33, "GNDPAD9", -0.474853, 3.050159, 0.499999, 0.499999],
  [34, "GNDPAD10", 4.399915, -3.134995, 4.850003, 0.4299966],
  [35, "GNDPAD11", 4.399915, 3.134995, 4.850003, 0.4299966],
] as const

const c1526234FootprintCircuitJson = [
  {
    type: "source_component",
    ftype: "simple_chip",
    source_component_id: "source_component_C1526234",
    name: "U1",
  },
  {
    type: "pcb_component",
    pcb_component_id: "pcb_component_C1526234",
    source_component_id: "source_component_C1526234",
    center: { x: 0, y: 0 },
    layer: "top",
    rotation: 0,
    width: 13.649833,
    height: 6.6999866,
    obstructs_within_bounds: true,
  },
  ...c1526234Pads.flatMap(([pin, name, x, y, width, height]) => [
    {
      type: "source_port",
      source_port_id: `source_port_C1526234_${pin}`,
      source_component_id: "source_component_C1526234",
      name: `pin${pin}`,
      pin_number: pin,
      port_hints: [name],
    },
    {
      type: "pcb_smtpad",
      shape: "rect",
      pcb_smtpad_id: `pcb_smtpad_C1526234_${pin}`,
      x,
      y,
      width,
      height,
      layer: "top",
      port_hints: [`pin${pin}`],
      pcb_component_id: "pcb_component_C1526234",
      pcb_port_id: `pcb_port_C1526234_${pin}`,
    },
  ]),
  {
    type: "pcb_courtyard_outline",
    pcb_courtyard_outline_id: "pcb_courtyard_outline_C1526234",
    pcb_component_id: "pcb_component_C1526234",
    layer: "top",
    outline: [
      { x: -7.743381, y: 3.774123 },
      { x: 7.234619, y: 3.774123 },
      { x: 7.234619, y: -3.761677 },
      { x: -7.743381, y: -3.761677 },
      { x: -7.743381, y: 3.774123 },
    ],
  },
] as AnyCircuitElement[]

const getStoredComponentBounds = (component: PcbComponent) => ({
  minX: component.center.x - component.width / 2,
  maxX: component.center.x + component.width / 2,
})

const misleadingU1Bounds = {
  center: { x: 7.3, y: -18.9949984 },
  width: 11.119993,
  height: 11.4398298,
}

const c2Bounds = {
  center: { x: 13, y: -21.2 },
  width: 1.56,
  height: 0.64,
}

const falseOverlap = {
  minX: c2Bounds.center.x - c2Bounds.width / 2,
  maxX: misleadingU1Bounds.center.x + misleadingU1Bounds.width / 2,
  centerY: c2Bounds.center.y,
  height: c2Bounds.height,
}

const realCourtyardGap = {
  u1MaxX: 11.074123,
  c2MinX: 12.07,
}

test("repro: rotated C1526234 has misleading pcb_component bounds", async () => {
  const { circuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        jlcpcb: async () => ({
          footprintCircuitJson: c1526234FootprintCircuitJson,
        }),
      },
    },
  })

  circuit.add(
    <board
      outline={[
        { x: 1, y: -29 },
        { x: 19, y: -29 },
        { x: 19, y: -9 },
        { x: 1, y: -9 },
      ]}
      routingDisabled
    >
      <chip
        name="U1"
        footprint="jlcpcb:C1526234"
        pcbX={7.3}
        pcbY={-20.1}
        pcbRotation={-90}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={13}
        pcbY={-21.2}
      />
      {/* Red overlays visualize the misleading pcb_component bounds consumed by
          circuit-json-placement-analysis. They are not physical clearances. */}
      <pcbnoterect
        pcbX={misleadingU1Bounds.center.x}
        pcbY={misleadingU1Bounds.center.y}
        width={misleadingU1Bounds.width}
        height={misleadingU1Bounds.height}
        strokeWidth={0.12}
        color="#ef4444"
        isStrokeDashed
      />
      <pcbnoterect
        pcbX={c2Bounds.center.x}
        pcbY={c2Bounds.center.y}
        width={c2Bounds.width}
        height={c2Bounds.height}
        strokeWidth={0.12}
        color="#ef4444"
        isStrokeDashed
      />
      <pcbnoterect
        pcbX={(falseOverlap.minX + falseOverlap.maxX) / 2}
        pcbY={falseOverlap.centerY}
        width={falseOverlap.maxX - falseOverlap.minX}
        height={falseOverlap.height}
        strokeWidth={0.08}
        color="rgba(239, 68, 68, 0.55)"
        isFilled
      />
      <pcbnotetext
        text="FALSE body-box overlap: 0.64 mm"
        pcbX={16}
        pcbY={-22.2}
        fontSize={0.42}
        color="#f87171"
      />
      <pcbnoteline
        x1={(falseOverlap.minX + falseOverlap.maxX) / 2}
        y1={falseOverlap.centerY - falseOverlap.height / 2}
        x2={14}
        y2={-22.2}
        strokeWidth={0.1}
        color="#f87171"
      />
      <pcbnotetext
        text="U1 stored pcb_component box (WRONG)"
        pcbX={6.4}
        pcbY={-13}
        fontSize={0.38}
        color="#f87171"
      />
      {/* Green dimension line shows the physical courtyard clearance. */}
      <pcbnoteline
        x1={realCourtyardGap.u1MaxX}
        y1={-20.25}
        x2={realCourtyardGap.c2MinX}
        y2={-20.25}
        strokeWidth={0.12}
        color="#22c55e"
      />
      <pcbnoteline
        x1={realCourtyardGap.u1MaxX}
        y1={-20.05}
        x2={realCourtyardGap.u1MaxX}
        y2={-20.45}
        strokeWidth={0.1}
        color="#22c55e"
      />
      <pcbnoteline
        x1={realCourtyardGap.c2MinX}
        y1={-20.05}
        x2={realCourtyardGap.c2MinX}
        y2={-20.45}
        strokeWidth={0.1}
        color="#22c55e"
      />
      <pcbnotetext
        text="REAL courtyard gap: 0.996 mm (CLEAR)"
        pcbX={16}
        pcbY={-19.5}
        fontSize={0.42}
        color="#4ade80"
      />
      <pcbnoteline
        x1={(realCourtyardGap.u1MaxX + realCourtyardGap.c2MinX) / 2}
        y1={-20.25}
        x2={14}
        y2={-19.5}
        strokeWidth={0.1}
        color="#4ade80"
      />
      <pcbnotetext
        text="BUG: -90deg pad centers rotate, but rectangular pad width/height do not"
        pcbX={10}
        pcbY={-10}
        fontSize={0.46}
        color="#ffffff"
      />
      <pcbnotetext
        text="RED dashed = stored bounds | MAGENTA = courtyard | GREEN = real gap"
        pcbX={10}
        pcbY={-10.75}
        fontSize={0.42}
        color="#ffffff"
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  const u1Source = circuitJson.find(
    (
      element,
    ): element is Extract<typeof element, { type: "source_component" }> =>
      element.type === "source_component" && element.name === "U1",
  )
  const c2Source = circuitJson.find(
    (
      element,
    ): element is Extract<typeof element, { type: "source_component" }> =>
      element.type === "source_component" && element.name === "C2",
  )
  const pcbComponents = circuitJson.filter(
    (element): element is PcbComponent => element.type === "pcb_component",
  )
  const u1 = pcbComponents.find(
    (component) =>
      component.source_component_id === u1Source?.source_component_id,
  )
  const c2 = pcbComponents.find(
    (component) =>
      component.source_component_id === c2Source?.source_component_id,
  )

  if (!u1 || !c2) throw new Error("Expected U1 and C2 PCB components")

  const u1StoredBounds = getStoredComponentBounds(u1)
  const c2StoredBounds = getStoredComponentBounds(c2)
  const misleadingStoredBoundsIntrusion =
    Math.min(u1StoredBounds.maxX, c2StoredBounds.maxX) -
    Math.max(u1StoredBounds.minX, c2StoredBounds.minX)
  expect(misleadingStoredBoundsIntrusion).toBeCloseTo(0.6399965, 6)

  const u1Courtyard = circuitJson.find(
    (element): element is PcbCourtyardOutline =>
      element.type === "pcb_courtyard_outline" &&
      element.pcb_component_id === u1.pcb_component_id,
  )
  const c2Courtyard = circuitJson.find(
    (element): element is PcbCourtyardRect =>
      element.type === "pcb_courtyard_rect" &&
      element.pcb_component_id === c2.pcb_component_id,
  )

  if (!u1Courtyard || !c2Courtyard) {
    throw new Error("Expected U1 and C2 courtyards")
  }

  const actualCourtyardGap =
    c2Courtyard.center.x -
    c2Courtyard.width / 2 -
    Math.max(...u1Courtyard.outline.map((point) => point.x))
  expect(actualCourtyardGap).toBeCloseTo(0.995877, 6)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
