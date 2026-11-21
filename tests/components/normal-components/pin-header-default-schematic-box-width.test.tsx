import { expect, test } from "bun:test"
import { checkSchematicPlacement } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getSchematicBoxWidth = (circuitJson: any[], name: string) => {
  const sourceComponent = circuitJson.find(
    (element) => element.type === "source_component" && element.name === name,
  )
  return circuitJson.find(
    (element) =>
      element.type === "schematic_component" &&
      element.source_component_id === sourceComponent.source_component_id,
  ).size.width
}

test("labelled pinheader default schematic box fits its labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm">
      <pinheader
        name="J1"
        pinCount={5}
        gender="male"
        pitch={2.54}
        pinLabels={["RUN", "DIR", "STEP", "nFAULT", "GND"]}
        schX={-3}
      />
      <pinheader
        name="J2"
        pinCount={5}
        pitch={2.54}
        schFacingDirection="left"
        pinLabels={["RUN", "DIR", "STEP", "nFAULT", "GND"]}
        schX={0}
        pcbY={8}
      />
      {/* Wide glyphs need more room than the per-character estimate. */}
      <pinheader
        name="J3"
        pinCount={4}
        pitch={2.54}
        pinLabels={["MMWW", "WWMM", "MWMW", "GND"]}
        schX={3}
        pcbY={-8}
      />
      {/* Inverted labels are drawn without the N_ prefix in a smaller font. */}
      <pinheader
        name="J4"
        pinCount={4}
        pitch={2.54}
        pinLabels={["N_RESET", "DIR", "STEP", "GND"]}
        schX={6}
        pcbY={-14}
      />
      <pinheader
        name="J5"
        pinCount={4}
        pitch={2.54}
        pinLabels={["RUN", "DIR", "STEP", "GND"]}
        schWidth={1.5}
        schX={9}
        pcbY={14}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(getSchematicBoxWidth(circuitJson, "J1")).toBeCloseTo(0.77, 5)
  expect(getSchematicBoxWidth(circuitJson, "J2")).toBeCloseTo(0.77, 5)
  expect(getSchematicBoxWidth(circuitJson, "J3")).toBeCloseTo(0.64, 5)
  expect(getSchematicBoxWidth(circuitJson, "J4")).toBeCloseTo(0.58, 5)
  // An explicit schWidth is left alone.
  expect(getSchematicBoxWidth(circuitJson, "J5")).toBe(1.5)

  const boxWidthWarnings = checkSchematicPlacement(circuitJson).filter(
    (warning) =>
      /J[1-4]\b/.test(warning.message) &&
      /schematic box|pin labels/i.test(warning.message),
  )
  expect(boxWidthWarnings.map((warning) => warning.message)).toEqual([])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
