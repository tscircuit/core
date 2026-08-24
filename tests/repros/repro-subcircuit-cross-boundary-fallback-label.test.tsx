import { expect, test } from "bun:test"
import type { SubcircuitProps } from "@tscircuit/props"
import type { InputProblem } from "@tscircuit/schematic-trace-solver"
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

test("cross-boundary subcircuit fallback labels are included in solver input", async () => {
  const { circuit } = getTestFixture()
  const solverInputProblems: InputProblem[] = []

  circuit.on("solver:started", (event) => {
    if (event.solverName === "SchematicTracePipelineSolver") {
      solverInputProblems.push(event.solverParams as InputProblem)
    }
  })

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
      <trace from=".J_LCD > .CS" to=".PICO .J_RIGHT > .GP17" />
      <trace name="LCD_GND" from=".J_LCD > .GND" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const netLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)
  expect(netLabelTexts).toContain("J_RIGHT_GP17")
  expect(netLabelTexts).not.toContain("J_LCD_CS")
  const internalGp17Trace = circuit.db.source_trace.getWhere({ name: "GP17" })!
  const internalGp17Label = circuit.db.schematic_net_label
    .list()
    .find(
      (label) =>
        label.text === "GP17" &&
        label.source_trace_id === internalGp17Trace.source_trace_id,
    )
  expect(internalGp17Label).toBeDefined()
  expect(
    solverInputProblems.some((inputProblem) =>
      inputProblem.netConnections.some(
        (connection) =>
          connection.netId === "J_RIGHT_GP17" && connection.pinIds.length === 1,
      ),
    ),
  ).toBe(true)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
