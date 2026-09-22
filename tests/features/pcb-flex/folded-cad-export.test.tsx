import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  transformCircuitJsonCadComponents,
  rotateVector,
  type CadComponentWithFoldState,
} from "@tscircuit/flex-utils"

test("folded CAD export is reversible and leaves the rendered PCB database flat", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={30}
      height={12}
      thickness={0.15}
      material="flex"
      schematicDisabled
      routingDisabled
    >
      <pcbbend
        name="B1"
        x1={0}
        y1={-6}
        x2={0}
        y2={6}
        bendAngle={90}
        bendRadius={2}
        bendSide="right"
      />
      <chip name="U1" footprint="soic8" pcbX={8} pcbRotation={37} />
      <resistor name="R1" footprint="0402" resistance="1k" pcbX={-8} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const flat = circuit.getCircuitJson(),
    before = JSON.stringify(flat)
  const folded = circuit.getCircuitJson({ foldPcbs: true })
  expect(JSON.stringify(circuit.getCircuitJson())).toBe(before)
  const cad = folded.filter(
    (e): e is CadComponentWithFoldState => e.type === "cad_component",
  )
  expect(cad.every((e) => e.is_on_folded_board)).toBe(true)
  expect(cad.some((e) => e.position.z > 6)).toBe(true)
  expect(folded.filter((e) => e.type.startsWith("pcb_"))).toEqual(
    flat.filter((e) => e.type.startsWith("pcb_")),
  )
  const restored = transformCircuitJsonCadComponents(folded, {
    foldPcbs: false,
  })
  for (const element of restored)
    if (element.type === "cad_component") {
      const original = flat.find(
        (e) =>
          e.type === "cad_component" &&
          e.cad_component_id === element.cad_component_id,
      ) as CadComponentWithFoldState
      for (const key of ["x", "y", "z"] as const)
        expect(element.position[key]).toBeCloseTo(original.position[key], 7)
      const v = { x: 0.3, y: 0.7, z: 1.2 }
      const a = rotateVector(v, element.rotation!),
        b = rotateVector(v, original.rotation!)
      for (const key of ["x", "y", "z"] as const)
        expect(a[key]).toBeCloseTo(b[key], 7)
    }
})
