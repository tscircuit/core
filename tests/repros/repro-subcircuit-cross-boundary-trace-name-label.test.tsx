import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const schSections = {
  rp2040: "rp2040",
  headers: "headers",
  controls: "controls",
  display: "display",
} as const

const leftHeaderPins = ["GP0", "GP1", "GND", "GP2", "GP3", "GP4"]
const rightHeaderPins = ["VBUS", "VSYS", "GND", "GP18", "GP17", "GP16"]

const PicoSubcircuit = (props: SubcircuitProps) => (
  <subcircuit name="PICO" {...props}>
    <pinheader
      name="J_LEFT"
      pinCount={6}
      pinLabels={leftHeaderPins}
      schSectionName={schSections.headers}
      schX={2}
      schY={3.5}
    />
    <pinheader
      name="J_RIGHT"
      pinCount={6}
      pinLabels={rightHeaderPins}
      schSectionName={schSections.headers}
      schX={5.2}
      schY={3.5}
    />
    <chip
      name="U1"
      footprint="soic8"
      pinLabels={{
        pin1: "GPIO2",
        pin2: "GPIO3",
        pin3: "GPIO17",
        pin4: "GPIO18",
        pin5: "GND",
        pin6: "V3V3",
        pin7: "RUN",
        pin8: "GPIO0",
      }}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["GPIO2", "GPIO3"] },
        rightSide: {
          direction: "top-to-bottom",
          pins: ["GPIO17", "GPIO18"],
        },
      }}
      schSectionName={schSections.rp2040}
      schX={5.2}
      schY={-3.6}
    />
    <trace name="GP2" from=".U1 > .GPIO2" to=".J_LEFT > .GP2" />
    <trace name="GP3" from=".U1 > .GPIO3" to=".J_LEFT > .GP3" />
    <trace name="GP17" from=".U1 > .GPIO17" to=".J_RIGHT > .GP17" />
    <trace name="GP18" from=".U1 > .GPIO18" to=".J_RIGHT > .GP18" />
  </subcircuit>
)

test("cross-boundary subcircuit traces use trace name instead of selector fallback labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="18mm" routingDisabled>
      <schematicsection name={schSections.controls} displayName="Controls" />
      <schematicsection name={schSections.display} displayName="Display" />
      <schematicsection name={schSections.headers} displayName="Headers" />
      <schematicsection name={schSections.rp2040} displayName="RP2040" />

      <PicoSubcircuit />
      <pinheader
        name="J_LCD"
        pinCount={4}
        pinLabels={["VCC", "GND", "CS", "SCK"]}
        schSectionName={schSections.display}
        schX={-6}
        schY={3.5}
      />

      <pinheader
        name="SW_UP"
        pinCount={2}
        pinLabels={["pin1", "pin4"]}
        schSectionName={schSections.controls}
        schX={-6.8}
        schY={-3}
      />
      <pinheader
        name="SW_DOWN"
        pinCount={2}
        pinLabels={["pin1", "pin4"]}
        schSectionName={schSections.controls}
        schX={-4.8}
        schY={-4.8}
      />

      <trace name="UP" from=".SW_UP > .pin1" to=".PICO .J_LEFT > .GP2" />
      <trace name="DN" from=".SW_DOWN > .pin1" to=".PICO .J_LEFT > .GP3" />
      <trace name="LCD_CS" from=".J_LCD > .CS" to=".PICO .J_RIGHT > .GP17" />
      <trace name="LCD_GND" from=".J_LCD > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)
  /** Returns a port center in schematic-world millimeters (+x right, +y up). */
  const getSchematicPortCenter = (componentName: string, portName: string) => {
    const sourceComponent = circuit.db.source_component.getWhere({
      name: componentName,
    })!
    const sourcePort = circuit.db.source_port
      .list({ source_component_id: sourceComponent.source_component_id })
      .find((port) => port.name === portName)!
    return circuit.db.schematic_port.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!.center
  }
  const gp17Labels = circuit.db.schematic_net_label
    .list()
    .filter((label) => label.text === "GP17")
  /** Compares schematic-world points in millimeters (+x right, +y up). */
  const pointsMatch = (
    first: { x: number; y: number },
    second: { x: number; y: number },
  ) =>
    Math.abs(first.x - second.x) < 1e-6 && Math.abs(first.y - second.y) < 1e-6
  /** Checks a label-to-port connection in schematic-world millimeters. */
  const isGp17LabelConnectedTo = (
    label: (typeof gp17Labels)[number],
    center: { x: number; y: number },
  ) => {
    if (!label.anchor_position) return false
    if (pointsMatch(label.anchor_position, center)) return true
    return circuit.db.schematic_trace
      .list()
      .some((trace) =>
        trace.edges.some(
          (edge) =>
            (pointsMatch(edge.from, label.anchor_position!) &&
              pointsMatch(edge.to, center)) ||
            (pointsMatch(edge.to, label.anchor_position!) &&
              pointsMatch(edge.from, center)),
        ),
      )
  }
  const sectionTitlePositions = circuit.db.schematic_text
    .list()
    .filter((text) =>
      ["Controls", "Display", "Headers", "RP2040"].includes(text.text),
    )
    .map((text) => `${text.position.x},${text.position.y}`)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  expect(new Set(sectionTitlePositions).size).toBe(4)
  expect(circuit.db.schematic_line.list().length).toBeGreaterThan(0)

  expect(netLabelTexts).toContain("UP")
  expect(netLabelTexts).toContain("DN")
  expect(netLabelTexts).toContain("LCD_CS")
  expect(netLabelTexts).not.toContain("J_LEFT_GP2")
  expect(netLabelTexts).not.toContain("J_LEFT_GP3")
  expect(netLabelTexts).not.toContain("J_RIGHT_GP17")
  expect(netLabelTexts).not.toContain("U1_GPIO2")
  expect(netLabelTexts).not.toContain("U1_GPIO3")
  expect(netLabelTexts).not.toContain("U1_GPIO17")
  expect(netLabelTexts).not.toContain("U1_GPIO18")
  expect(gp17Labels).toHaveLength(2)
  const internalGp17Trace = circuit.db.source_trace.getWhere({ name: "GP17" })!
  const externalLcdCsTrace = circuit.db.source_trace.getWhere({
    name: "LCD_CS",
  })!
  const u1Gp17Label = gp17Labels.find(
    (label) => label.source_trace_id === internalGp17Trace.source_trace_id,
  )!
  const headerGp17Label = gp17Labels.find(
    (label) => label.source_trace_id === externalLcdCsTrace.source_trace_id,
  )!
  expect(
    isGp17LabelConnectedTo(u1Gp17Label, getSchematicPortCenter("U1", "GPIO17")),
  ).toBe(true)
  expect(
    isGp17LabelConnectedTo(
      headerGp17Label,
      getSchematicPortCenter("J_RIGHT", "GP17"),
    ),
  ).toBe(true)
})
