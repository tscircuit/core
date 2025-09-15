import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("jumper internallyConnectedPins with numbers should work correctly", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* Test jumper with numbers */}
      <jumper
        name="JP1"
        internallyConnectedPins={[[1, 2]]}
        pinCount={2}
        schX={0}
        schY={0}
      />

      {/* Test jumper with mixed strings and numbers */}
      <jumper
        name="JP2"
        internallyConnectedPins={[["pin1", 2]]}
        pinCount={2}
        schX={3}
        schY={0}
      />

      {/* Test jumper with pure strings (existing behavior) */}
      <jumper
        name="JP3"
        internallyConnectedPins={[["pin1", "pin2"]]}
        pinCount={2}
        schX={6}
        schY={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Check that all jumpers were processed correctly
  const jp1 = circuit.selectOne("jumper.JP1") as any
  const jp2 = circuit.selectOne("jumper.JP2") as any
  const jp3 = circuit.selectOne("jumper.JP3") as any

  // Verify internal connections for JP1 (numbers)
  const jp1InternalPins = jp1._getInternallyConnectedPins()
  expect(jp1InternalPins).toHaveLength(1)
  expect(jp1InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ])

  // Verify internal connections for JP2 (mixed)
  const jp2InternalPins = jp2._getInternallyConnectedPins()
  expect(jp2InternalPins).toHaveLength(1)
  expect(jp2InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ])

  // Verify internal connections for JP3 (strings)
  const jp3InternalPins = jp3._getInternallyConnectedPins()
  expect(jp3InternalPins).toHaveLength(1)
  expect(jp3InternalPins[0].map((p: any) => p.props.name).sort()).toEqual([
    "pin1",
    "pin2",
  ])

  // Verify the internallyConnectedPinNames getter processes numbers correctly
  expect(jp1.internallyConnectedPinNames).toEqual([["pin1", "pin2"]])
  expect(jp2.internallyConnectedPinNames).toEqual([["pin1", "pin2"]])
  expect(jp3.internallyConnectedPinNames).toEqual([["pin1", "pin2"]])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
