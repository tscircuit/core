import { expect, test } from "bun:test"
import { pcb_placement_error } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("CAD mounts in a bend zone report errors and keep flat placements", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      material="flex"
      pcbX={30}
      pcbY={20}
      width={40}
      height={20}
      thickness={0.12}
      routingDisabled
    >
      <pcbbend
        x1={0}
        y1={-10}
        x2={0}
        y2={10}
        bendAngle={90}
        bendRadius={1}
        bendSide="left"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbY={-4} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbY={0}
        cadModel={<cadmodel modelUrl="https://example.com/model.glb" />}
      />
      <chip
        name="U1"
        pcbY={4}
        footprint={
          <footprint>
            <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
          </footprint>
        }
      />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={-8} />
      <pcbnotetext
        text="Bend-zone mounts report errors"
        pcbY={-8}
        fontSize={1}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const diagnostics = circuit.db.pcb_placement_error.list()
  expect(
    diagnostics.filter((error) =>
      error.message.includes("overlaps PCB bend zone"),
    ),
  ).toHaveLength(5)
  const errors = diagnostics.filter((error) =>
    error.message.includes("CAD mount intersects PCB bend zone"),
  )
  expect(errors).toHaveLength(3)
  const cad = circuit.db.cad_component.list()
  expect(cad).toHaveLength(4)
  for (const pcbComponent of circuit.db.pcb_component.list()) {
    const placement = cad.find(
      (record) => record.pcb_component_id === pcbComponent.pcb_component_id,
    )!
    if (Math.abs(pcbComponent.center.x - 30) < 0.1) {
      const error = errors.find((record) =>
        record.message.includes(pcbComponent.pcb_component_id),
      )!
      expect(error.message).toContain("CAD mount intersects PCB bend zone")
      expect(pcb_placement_error.safeParse(error).success).toBe(true)
      expect(placement.position).toEqual({
        x: pcbComponent.center.x,
        y: pcbComponent.center.y,
        z: 0.06,
      })
      expect(placement.is_on_folded_board).toBeUndefined()
    } else {
      expect(placement.is_on_folded_board).toBe(true)
      expect(placement.position.z).toBeGreaterThan(6)
    }
  }
  expect(circuit.db.schematic_component.list()).toHaveLength(4)
  const before = circuit.getCircuitJson()
  await circuit.renderUntilSettled()
  expect(circuit.getCircuitJson()).toEqual(before)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
