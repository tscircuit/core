import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getPcbElementBounds } from "@tscircuit/circuit-json-util"

test("ten 0603 resistors fit inside an 18 by 8 mm bounded packing group", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <group name="G" pcbPack width="18mm" height="8mm">
        {Array.from({ length: 10 }, (_, i) => (
          <resistor
            key={i}
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
          />
        ))}
      </group>
      <pcbnotetext
        text="Ten 0603 resistors in 18 x 8 mm"
        pcbY={-7}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_packing_error.list()).toHaveLength(0)
  const packed = circuit.db.pcb_component.list()
  expect(packed).toHaveLength(10)
  expect(packed.every((c) => c.position_mode === "packed")).toBe(true)
  expect(new Set(packed.map((c) => `${c.center.x},${c.center.y}`)).size).toBe(
    10,
  )
  for (const courtyard of circuit.db.pcb_courtyard_rect.list()) {
    const bounds = getPcbElementBounds(courtyard)!
    expect(bounds.minX).toBeGreaterThanOrEqual(-9 - 1e-6)
    expect(bounds.maxX).toBeLessThanOrEqual(9 + 1e-6)
    expect(bounds.minY).toBeGreaterThanOrEqual(-4 - 1e-6)
    expect(bounds.maxY).toBeLessThanOrEqual(4 + 1e-6)
  }
  expect(
    circuit
      .getCircuitJson()
      .filter((e) => e.type === "pcb_courtyard_overlap_error"),
  ).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
