import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getErrorTypes = (circuitJson: Array<{ type: string }>) =>
  new Set(
    circuitJson
      .filter((elm) => elm.type.includes("error"))
      .map((elm) => elm.type),
  )

const getWarningTypes = (circuitJson: Array<{ type: string }>) =>
  new Set(
    circuitJson
      .filter((elm) => elm.type.includes("warning"))
      .map((elm) => elm.type),
  )

test("platform netlistDrcChecksDisabled disables netlist DRC errors", async () => {
  const { circuit } = getTestFixture({
    platform: {
      netlistDrcChecksDisabled: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor footprint="0402" resistance={1000} name="R1" pcbX={-2} />
      <resistor footprint="0402" resistance={1000} name="R2" pcbX={2} />
      <trace from=".R1 .1" to=".R2 .1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    getErrorTypes(circuit.getCircuitJson() as Array<{ type: string }>),
  ).toEqual(new Set())
})

test("platform placementDrcChecksDisabled disables placement DRC errors", async () => {
  const { circuit } = getTestFixture({
    platform: {
      placementDrcChecksDisabled: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor
        footprint="0402"
        resistance={1000}
        name="R1"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        footprint="0402"
        resistance={1000}
        name="R2"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    getErrorTypes(circuit.getCircuitJson() as Array<{ type: string }>),
  ).toEqual(new Set())
})

test("pin specification checks", async () => {
  const { circuit } = getTestFixture({
    platform: {
      netlistDrcChecksDisabled: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip name="U1" pinLabels={{ 1: "A", 2: "B", 3: "C", 4: "D" }} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warningTypes = getWarningTypes(
    circuit.getCircuitJson() as Array<{ type: string }>,
  )

  expect(warningTypes.has("source_component_pins_underspecified_warning")).toBe(
    true,
  )
  expect(warningTypes.has("source_no_power_pin_defined_warning")).toBe(true)
  expect(warningTypes.has("source_no_ground_pin_defined_warning")).toBe(true)
})

test("platform drcChecksDisabled disables all DRC errors", async () => {
  const { circuit } = getTestFixture({
    platform: {
      drcChecksDisabled: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <resistor
        footprint="0402"
        resistance={1000}
        name="R1"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        footprint="0402"
        resistance={1000}
        name="R2"
        pcbX={0}
        pcbY={0}
      />
      <trace from=".R1 .1" to=".R2 .1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(
    getErrorTypes(circuit.getCircuitJson() as Array<{ type: string }>),
  ).toEqual(new Set())
})
