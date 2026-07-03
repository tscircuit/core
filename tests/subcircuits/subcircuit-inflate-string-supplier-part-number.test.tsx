import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Reproduction test for a broken chip render during circuit JSON inflation.
 *
 * When a source_component's `supplier_part_numbers.jlcpcb` arrives as a bare
 * string (e.g. "C7484") instead of an array (["C7484"]), the chipProps zod
 * schema rejects it with "Expected array, received string". That validation
 * error is swallowed in create-instance-from-react-element.ts and swapped for
 * an ErrorPlaceholder, producing a `Could not create chip` render failure.
 *
 * inflateSourceChip should normalize the string into a single-element array so
 * the chip inflates cleanly.
 */
test("inflation of chip with string-valued supplier part number should not error", async () => {
  // Render a chip to get valid circuit JSON, then mutate the supplier part
  // number to the malformed bare-string shape some producers emit.
  const { circuit: sourceCircuit } = getTestFixture()

  sourceCircuit.add(
    <board width="10mm" height="10mm">
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
    </board>,
  )

  await sourceCircuit.renderUntilSettled()

  const sourceJson = sourceCircuit.getCircuitJson() as CircuitJson
  const sourceChip = sourceJson.find(
    (elm) => elm.type === "source_component" && elm.name === "U1",
  ) as any
  // Malformed shape: a bare string instead of an array.
  sourceChip.supplier_part_numbers = { jlcpcb: "C7484" }

  const { circuit: targetCircuit } = getTestFixture()

  targetCircuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="Inflated" circuitJson={sourceJson} />
    </board>,
  )

  await targetCircuit.renderUntilSettled()

  const targetJson = targetCircuit.getCircuitJson()
  const targetErrors = targetJson.filter((elm) => elm.type.includes("error"))
  expect(targetErrors).toHaveLength(0)

  // The chip should have inflated and the string coerced into an array.
  const inflatedChip = targetJson.find(
    (elm) => elm.type === "source_component" && elm.name === "U1",
  ) as any
  expect(inflatedChip).toBeDefined()
  expect(inflatedChip.supplier_part_numbers?.jlcpcb).toEqual(["C7484"])
})
