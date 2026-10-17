import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bounded pcbPack group avoids fixed parts placed outside the group", async () => {
  const { circuit } = getTestFixture()

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

  const u1 = circuit.db.pcb_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "U1" })
      ?.source_component_id,
  })!
  const r1 = circuit.db.pcb_component.getWhere({
    source_component_id: circuit.db.source_component.getWhere({ name: "R1" })
      ?.source_component_id,
  })!

  const distR1ToU1 = Math.hypot(
    r1.center.x - u1.center.x,
    r1.center.y - u1.center.y,
  )
  expect(distR1ToU1).toBeGreaterThan(2)

  const overlapErrors = circuit
    .getCircuitJson()
    .filter(
      (elm) =>
        elm.type === "pcb_footprint_overlap_error" ||
        elm.type === "pcb_courtyard_overlap_error",
    )
  expect(overlapErrors).toHaveLength(0)
})

test("bounded pcbPack group tries tighter gap when default 1mm gap cannot fit all parts and never stacks unplaced parts at (0, 0)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <group name="G" pcbPack pcbX={0} pcbY={0} width="18mm" height="8mm">
        {Array.from({ length: 10 }, (_, i) => (
          <resistor
            key={i}
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
          />
        ))}
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const packingErrors = circuit.db.pcb_packing_error.list()
  expect(packingErrors).toHaveLength(0)

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents).toHaveLength(10)

  for (let i = 0; i < pcbComponents.length; i++) {
    const a = pcbComponents[i]!
    expect(Math.abs(a.center.x)).toBeLessThanOrEqual(9)
    expect(Math.abs(a.center.y)).toBeLessThanOrEqual(4)
    for (let j = i + 1; j < pcbComponents.length; j++) {
      const b = pcbComponents[j]!
      const dist = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y)
      expect(dist).toBeGreaterThan(0.5)
    }
  }
})

test("when bounded pcbPack group truly overflows, it reports pcb_packing_error without stacking overflow parts at group center", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <group
        name="G"
        pcbPack
        pcbPackGap="1mm"
        pcbX={0}
        pcbY={0}
        width="4mm"
        height="4mm"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <resistor
            key={i}
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
          />
        ))}
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const packingErrors = circuit.db.pcb_packing_error.list()
  expect(packingErrors.length).toBeGreaterThan(0)

  const pcbComponents = circuit.db.pcb_component.list()
  expect(pcbComponents).toHaveLength(5)
  for (let i = 0; i < pcbComponents.length; i++) {
    for (let j = i + 1; j < pcbComponents.length; j++) {
      const a = pcbComponents[i]!
      const b = pcbComponents[j]!
      const dist = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y)
      expect(dist).toBeGreaterThan(0.5)
    }
  }
})
