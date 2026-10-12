import { expect, test } from "bun:test"
import { Circuit } from "lib"

test("pcbPack group treats fixed components outside the group as obstacles", async () => {
  const circuit = new Circuit({ platform: { partsEngineDisabled: true } })
  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
      <group name="G" pcbPack pcbX={0} pcbY={0} width="30mm" height="14mm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <resistor key={i} name={`R${i}`} resistance="1k" footprint="0603" />
        ))}
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()

  const u1 = json.find(
    (e: any) =>
      e.type === "pcb_component" &&
      e.source_component_id?.includes("source_component_0"),
  ) as any
  const r1 = json.find(
    (e: any) =>
      e.type === "pcb_component" &&
      e.source_component_id?.includes("source_component_1"),
  ) as any

  expect(u1).toBeDefined()
  expect(r1).toBeDefined()
  expect(u1.center).toEqual({ x: 0, y: 0 })

  // R1 must not be placed at (0, 0) overlapping U1
  const distance = Math.hypot(
    r1.center.x - u1.center.x,
    r1.center.y - u1.center.y,
  )
  expect(distance).toBeGreaterThan(2.0)
})

test("pcbPack group with offset position avoids outside fixed components", async () => {
  const circuit = new Circuit({ platform: { partsEngineDisabled: true } })
  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <chip name="U1" footprint="soic8" pcbX={10} pcbY={-5} />
      <group name="G" pcbPack pcbX={10} pcbY={-5} width="30mm" height="14mm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <resistor key={i} name={`R${i}`} resistance="1k" footprint="0603" />
        ))}
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()

  const u1 = json.find(
    (e: any) =>
      e.type === "pcb_component" &&
      e.source_component_id?.includes("source_component_0"),
  ) as any
  const r1 = json.find(
    (e: any) =>
      e.type === "pcb_component" &&
      e.source_component_id?.includes("source_component_1"),
  ) as any

  expect(u1).toBeDefined()
  expect(r1).toBeDefined()
  expect(u1.center).toEqual({ x: 10, y: -5 })

  // R1 must not overlap U1
  const distance = Math.hypot(
    r1.center.x - u1.center.x,
    r1.center.y - u1.center.y,
  )
  expect(distance).toBeGreaterThan(2.0)
})
