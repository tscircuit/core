import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with alphanumeric pinLabels keys (like A1) should throw clear error", async () => {
  const { circuit } = getTestFixture()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{
            A1: "GND",
            B1: "VCC",
          }}
        />
      </board>,
    )
  }).toThrow(
    'Invalid pinLabels key "A1". Expected "pin<number>" (e.g. pin1, pin2).',
  )
})

test("chip with numeric pinLabels keys should throw clear error", async () => {
  const { circuit } = getTestFixture()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{
            "1": "GND",
          }}
        />
      </board>,
    )
  }).toThrow(
    'Invalid pinLabels key "1". Expected "pin<number>" (e.g. pin1, pin2).',
  )
})
test("chip with multiple invalid pinLabels keys should throw consolidated error", async () => {
  const { circuit } = getTestFixture()

  expect(() => {
    circuit.add(
      <board width="10mm" height="10mm">
        <chip
          name="U1"
          footprint="soic8"
          pinLabels={{
            A1: "GND",
            B1: "VCC",
          }}
        />
      </board>,
    )
  }).toThrow(
    'Invalid pinLabels key "A1". Expected "pin<number>" (e.g. pin1, pin2).\nInvalid pinLabels key "B1". Expected "pin<number>" (e.g. pin1, pin2).',
  )
})
