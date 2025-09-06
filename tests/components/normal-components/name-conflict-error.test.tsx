import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("should create source_failed_to_create_component_error for same-name naming conflict", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R1" resistance="2k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that error was created
  const errors = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )

  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    component_name: "R1",
    error_type: "source_failed_to_create_component_error",
    message: `Cannot create component "R1": A component with the same name already exists`,
    type: "source_failed_to_create_component_error",
  })

  // Check that only one source_component was created
  const sourceComponents = circuitJson.filter(
    (e) => e.type === "source_component",
  )

  expect(sourceComponents).toHaveLength(1)
  expect(sourceComponents[0]).toMatchObject({
    name: "R1",
    type: "source_component",
  })
})

test("should allow components with different names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="2k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that no errors were created
  const errors = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )

  expect(errors).toHaveLength(0)

  // Check that two source_components were created
  const sourceComponents = circuitJson.filter(
    (e) => e.type === "source_component",
  )

  expect(sourceComponents).toHaveLength(2)
  expect(sourceComponents.map((c) => c.name)).toEqual(["R1", "R2"])
})

test("should handle multiple components in different groups without name conflicts", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="Group1">
        <resistor name="R3" resistance="1k" footprint="0402" />
      </group>
      <group name="Group2">
        <resistor name="R4" resistance="2k" footprint="0402" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Check that no errors were created
  const errors = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )

  expect(errors).toHaveLength(0)

  // Check that two source_components were created
  const sourceComponents = circuitJson.filter(
    (e) => e.type === "source_component",
  )

  expect(sourceComponents).toHaveLength(2)
  // They should have different names
  expect(sourceComponents[0].name).not.toEqual(sourceComponents[1].name)
})
