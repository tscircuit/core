import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("pcbPath coordinates are measured from anchor port, not component center", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} />
      <trace name="T1" from="R1.pin2" to="R2.pin1" pcbPath={[{ x: 0, y: 2 }]} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const trace = circuit.db.pcb_trace.list()[0]
  expect(trace).toBeDefined()
  // R1 center is at (-3, 0), R1.pin2 is at (-2.49, 0)
  // With pcbPath={[{ x: 0, y: 2 }]}, the waypoint must be relative to R1.pin2 at (-2.49, 2), not (-3, 2)
  const waypoint = trace.route[1]
  if (waypoint.route_type !== "wire") throw new Error("Expected wire waypoint")
  expect(waypoint.x).toBeCloseTo(-2.49, 2)
  expect(waypoint.y).toBeCloseTo(2, 2)
})

test("pcbPath coordinates rotate around the anchor port when component is rotated", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbRotation={90}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} />
      <trace name="T1" from="R1.pin2" to="R2.pin1" pcbPath={[{ x: 0, y: 2 }]} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const trace = circuit.db.pcb_trace.list()[0]
  expect(trace).toBeDefined()
  // With pcbRotation={90}, R1.pin2 is at (-3, 0.51).
  // Waypoint (0, 2) rotated 90 deg CCW is (-2, 0).
  // Relative to R1.pin2: (-3 - 2, 0.51 + 0) = (-5, 0.51), not (-5, 0).
  const waypoint = trace.route[1]
  if (waypoint.route_type !== "wire") throw new Error("Expected wire waypoint")
  expect(waypoint.x).toBeCloseTo(-5, 2)
  expect(waypoint.y).toBeCloseTo(0.51, 2)
})
