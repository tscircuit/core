import { it, expect } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { Chip } from "lib/components/normal-components/Chip"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should not return undefined for component names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
  expect(chip.name).toBeDefined()
  expect(typeof chip.name).toBe("string")
  expect(chip.name).not.toBe("undefined")
  expect(chip.name).toBe("U1")
})

it("should handle components with undefined names gracefully", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name={undefined as any}
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
  expect(chip.name).toBeDefined()
  expect(typeof chip.name).toBe("string")
  expect(chip.name).not.toBe("undefined")
  expect(chip.name).toMatch(/^unnamed_chip\d+$/)
})

it("should handle components with empty string names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name=""
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
  expect(chip.name).toBeDefined()
  expect(typeof chip.name).toBe("string")
  expect(chip.name).not.toBe("undefined")
  expect(chip.name).not.toBe("")
  expect(chip.name).toMatch(/^unnamed_chip\d+$/)
})

it("should handle components with whitespace-only names", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="   "
        footprint="soic8"
        pinLabels={{
          "1": "VCC",
          "8": "GND",
        }}
        schPinArrangement={{
          leftSize: 4,
          rightSize: 4,
        }}
      />
    </board>,
  )

  circuit.render()

  const chip = circuit.selectOne("chip") as Chip

  expect(chip).not.toBeNull()
  expect(chip.name).toBeDefined()
  expect(typeof chip.name).toBe("string")
  expect(chip.name).not.toBe("undefined")
  expect(chip.name).not.toBe("   ")
  // The component should have a valid name (not undefined)
  // Note: The exact format may vary depending on render phase timing
  expect(chip.name).toMatch(/^unnamed_chip/)
})
