import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("alphanumeric pinLabels keys resolve against footprint pad names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        footprint="bga9"
        pinLabels={{
          pinA1: "VCC",
          B2: "GND",
          pinC3: ["DATA"],
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const createErrors = circuitJson.filter(
    (el) => el.type === "source_failed_to_create_component_error",
  )
  expect(createErrors).toHaveLength(0)

  const ports = circuit.selectAll("port") as any[]
  const pinNumberForLabel = (label: string) =>
    ports.find((p) => p.getNameAndAliases().includes(label))?._parsedProps
      .pinNumber

  // bga9 pads A1..C3 map to pin numbers 1..9 in row-major order.
  expect(pinNumberForLabel("VCC")).toBe(1) // A1
  expect(pinNumberForLabel("GND")).toBe(5) // B2
  expect(pinNumberForLabel("DATA")).toBe(9) // C3
})
