import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("propagates rightAngle to the source component as is_right_angle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader name="J1" pinCount={2} pitch="2.54mm" rightAngle={false} />
      <pinheader name="J2" pinCount={2} pitch="2.54mm" rightAngle={true} />
      <pinheader name="J3" pinCount={2} pitch="2.54mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePinHeaders = circuit.db.source_component.list() as any[]
  const byName = Object.fromEntries(
    sourcePinHeaders.map((c) => [c.name, c]),
  )

  // Explicit rightAngle={false} must be recorded as is_right_angle: false so the
  // parts engine can filter out right-angle / SMD parts for a straight header.
  expect(byName.J1.is_right_angle).toBe(false)
  // rightAngle={true} must be recorded as is_right_angle: true.
  expect(byName.J2.is_right_angle).toBe(true)
  // When rightAngle is omitted, is_right_angle is undefined (not forced).
  expect(byName.J3.is_right_angle).toBeUndefined()
})