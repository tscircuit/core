import { Fragment } from "react"
import { expect, test } from "bun:test"
import { checkPcbCopperOverKeepout } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Footprint-local positions in mm: +X right, +Y up; the board places each
// copy by translation. Based on BT1's envelope in ESP32-E-Reader 1.0.22.
const BatteryConnector = ({
  name,
  pcbX,
  pcbY,
}: { name: string; pcbX: number; pcbY: number }) => (
  <chip
    name={name}
    pcbX={pcbX}
    pcbY={pcbY}
    pinLabels={{ pin1: "BAT", pin2: "GND" }}
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          pcbX={1}
          holeDiameter={0.85}
          outerDiameter={1.5}
          shape="circle"
        />
        <platedhole
          portHints={["pin2"]}
          pcbX={-1}
          holeDiameter={0.85}
          outerDiameter={1.4}
          shape="circle"
        />
        <courtyardrect width={6.8} height={8.4} pcbY={2.35} />
        <silkscreenpath
          route={[
            { x: -3, y: -1.4 },
            { x: -3, y: 6.2 },
            { x: 3, y: 6.2 },
            { x: 3, y: -1.4 },
            { x: -3, y: -1.4 },
          ]}
        />
      </footprint>
    }
  />
)

test("keepout placement DRC respects JSX permissions for courtyard-only overlaps", async () => {
  const { circuit } = getTestFixture()
  const cases = [
    { name: "BT1", x: -22, y: 7, label: "DEFAULT: ERROR", props: {} },
    {
      name: "BT2",
      x: 0,
      y: 7,
      label: "excludeRefs: ALLOWED",
      props: { excludeRefs: [".BT2"] },
    },
    {
      name: "BT3",
      x: 22,
      y: 7,
      label: "allowPlacements: ALLOWED",
      props: { allowPlacements: true },
    },
    {
      name: "BT4",
      x: -22,
      y: -12,
      label: "allowTraces: ERROR",
      props: { allowTraces: true },
    },
    {
      name: "BT5",
      x: 0,
      y: -12,
      label: "warningOnly: WARNING",
      props: { warningOnly: true },
    },
    {
      name: "BT6",
      x: 22,
      y: -12,
      label: "bottom keepout: ALLOWED",
      props: { layers: ["bottom" as const] },
    },
  ]
  circuit.add(
    <board width={68} height={42} schematicDisabled>
      <pcbnotetext
        text="COURTYARD OVERLAP - ALL COPPER PADS CLEAR"
        pcbY={19}
        fontSize={0.9}
      />
      {cases.map(({ name, x, y, label, props }) => (
        <Fragment key={name}>
          <BatteryConnector name={name} pcbX={x + 2} pcbY={y} />
          <hole diameter={2.7} pcbX={x - 3} pcbY={y + 4.12} />
          <keepout
            shape="circle"
            radius={3.2}
            pcbX={x - 3}
            pcbY={y + 4.12}
            {...props}
          />
          <pcbnotetext text={label} pcbX={x} pcbY={y - 4} fontSize={0.7} />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(checkPcbCopperOverKeepout(circuit.getCircuitJson())).toEqual([])
  const errors = circuit.db.pcb_placement_error.list()
  expect(errors).toHaveLength(2)
  expect(errors.map((error) => error.message).sort()).toEqual([
    expect.stringContaining("Courtyard of BT1"),
    expect.stringContaining("Courtyard of BT4"),
  ])
  const warnings = circuit
    .getCircuitJson()
    .filter((el) => el.type === "pcb_keepout_overlap_warning")
  expect(warnings).toHaveLength(1)
  expect(warnings[0]?.message).toContain("BT5")
  const source = circuit.db.source_component.getWhere({ name: "BT2" })!
  const component = circuit.db.pcb_component.getWhere({
    source_component_id: source.source_component_id,
  })!
  expect(circuit.db.pcb_keepout.list()[1]?.excluded_pcb_component_ids).toEqual([
    component.pcb_component_id,
  ])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1400,
    height: 900,
    showCourtyards: true,
  })
})
